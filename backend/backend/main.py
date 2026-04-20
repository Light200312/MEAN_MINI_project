from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
import uuid
import json
import asyncio
import datetime

import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

from . import config
from .council import (
    run_full_council,
    generate_conversation_title,
    stage1_collect_responses,
    stage2_collect_rankings,
    stage3_synthesize_final,
    calculate_aggregate_rankings,
)

app = FastAPI(title="LLM Council API")

# -----------------------------
# MongoDB Connection
# -----------------------------
client = AsyncIOMotorClient(config.MONGODB_URL)
database = client.council_db
user_collection = database.get_collection("users")
conv_collection = database.get_collection("conversations")


# -----------------------------
# AUTH MODELS
# -----------------------------
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -----------------------------
# AUTH UTILS
# -----------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# -----------------------------
# AUTH ROUTES
# -----------------------------
@app.post("/api/auth/register")
async def register(user: UserRegister):
    existing_user = await user_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = {
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.datetime.utcnow(),
    }

    new_user = await user_collection.insert_one(user_dict)

    return {"status": "success", "user_id": str(new_user.inserted_id)}


@app.post("/api/auth/login")
async def login(user: UserLogin):
    db_user = await user_collection.find_one({"email": user.email})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
    }


# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://192.168.1.9:5173",
        "http://192.168.1.9:5174",
        "http://192.168.1.9:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# REQUEST MODELS
# -----------------------------
class SendMessageRequest(BaseModel):
    content: str


class ConversationMetadata(BaseModel):
    id: str
    created_at: str
    title: str
    message_count: int


class Conversation(BaseModel):
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]


# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.get("/")
async def root():
    return {"status": "ok", "service": "LLM Council API"}


# -----------------------------
# CONVERSATIONS
# -----------------------------
@app.get("/api/conversations")
async def list_conversations(user_id: Optional[str] = None):
    """
    List conversations for a user
    """

    if not user_id:
        return []

    cursor = conv_collection.find({"user_id": user_id})

    conversations = []

    async for doc in cursor:
        conversations.append(
            {
                "id": doc["id"],
                "created_at": doc["created_at"],
                "title": doc["title"],
                "message_count": len(doc["messages"]),
            }
        )

    return conversations


@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(user_id: Optional[str] = None):

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    conversation_id = str(uuid.uuid4())

    conversation = {
        "id": conversation_id,
        "user_id": user_id,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "title": "New Council Session",
        "messages": [],
    }

    await conv_collection.insert_one(conversation)

    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):

    conversation = await conv_collection.find_one({"id": conversation_id})

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation["_id"] = str(conversation["_id"])

    return conversation


# -----------------------------
# SEND MESSAGE
# -----------------------------
@app.post("/api/conversations/{conversation_id}/message")
async def send_message(conversation_id: str, request: SendMessageRequest):

    conversation = await conv_collection.find_one({"id": conversation_id})

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_first_message = len(conversation["messages"]) == 0

    user_msg = {
        "role": "user",
        "content": request.content,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

    await conv_collection.update_one(
        {"id": conversation_id}, {"$push": {"messages": user_msg}}
    )

    if is_first_message:
        title = await generate_conversation_title(request.content)

        await conv_collection.update_one(
            {"id": conversation_id}, {"$set": {"title": title}}
        )

    stage1_results, stage2_results, stage3_result, metadata = await run_full_council(
        request.content
    )

    assistant_msg = {
        "role": "assistant",
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

    await conv_collection.update_one(
        {"id": conversation_id}, {"$push": {"messages": assistant_msg}}
    )

    return {
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata,
    }


# -----------------------------
# STREAMING MESSAGE
# -----------------------------
@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(conversation_id: str, request: SendMessageRequest):

    conversation = await conv_collection.find_one({"id": conversation_id})

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_first_message = len(conversation["messages"]) == 0

    async def event_generator():

        try:
            user_msg = {
                "role": "user",
                "content": request.content,
                "timestamp": datetime.datetime.utcnow().isoformat(),
            }

            await conv_collection.update_one(
                {"id": conversation_id}, {"$push": {"messages": user_msg}}
            )

            title_task = None

            if is_first_message:
                title_task = asyncio.create_task(
                    generate_conversation_title(request.content)
                )

            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"

            stage1_results = await stage1_collect_responses(request.content)

            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"

            stage2_results, label_to_model = await stage2_collect_rankings(
                request.content, stage1_results
            )

            agg_rankings = calculate_aggregate_rankings(
                stage2_results, label_to_model
            )

            yield f"data: {json.dumps({'type': 'stage2_complete','data': stage2_results,'metadata': {'label_to_model': label_to_model,'aggregate_rankings': agg_rankings}})}\n\n"

            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"

            stage3_result = await stage3_synthesize_final(
                request.content, stage1_results, stage2_results
            )

            yield f"data: {json.dumps({'type': 'stage3_complete','data': stage3_result})}\n\n"

            if title_task:
                title = await title_task

                await conv_collection.update_one(
                    {"id": conversation_id}, {"$set": {"title": title}}
                )

                yield f"data: {json.dumps({'type': 'title_complete','data': {'title': title}})}\n\n"

            assistant_msg = {
                "role": "assistant",
                "stage1": stage1_results,
                "stage2": stage2_results,
                "stage3": stage3_result,
                "metadata": {
                    "label_to_model": label_to_model,
                    "aggregate_rankings": agg_rankings,
                },
                "timestamp": datetime.datetime.utcnow().isoformat(),
            }

            await conv_collection.update_one(
                {"id": conversation_id}, {"$push": {"messages": assistant_msg}}
            )

            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error','message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ============= SIMPLE CHAT ENDPOINT (Non-Council) =============
@app.post("/api/chat/simple")
async def simple_chat(request: SendMessageRequest):
    """
    Simple 1-on-1 AI chat without council process.
    Returns immediate response from a single model.
    """
    from .openrouter import query_model
    from .config import CHAIRMAN_MODEL
    
    messages = [{"role": "user", "content": request.content}]
    
    try:
        response = await query_model(CHAIRMAN_MODEL, messages)
        if response is None:
            raise HTTPException(status_code=500, detail="Failed to get AI response")
        
        return {
            "model": CHAIRMAN_MODEL,
            "response": response.get('content', ''),
            "reasoning": response.get('reasoning_details')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/chat/simple/stream")
async def simple_chat_stream(request: SendMessageRequest):
    """
    Simple chat with streaming response.
    Streams AI response token-by-token.
    """
    from .openrouter import query_model
    from .config import CHAIRMAN_MODEL
    
    async def event_generator():
        try:
            messages = [{"role": "user", "content": request.content}]
            response = await query_model(CHAIRMAN_MODEL, messages)
            
            if response is None:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Failed to get response'})}\n\n"
                return
            
            content = response.get('content', '')
            
            # Stream the response
            yield f"data: {json.dumps({'type': 'start', 'model': CHAIRMAN_MODEL})}\n\n"
            
            # For now, yield entire response (streaming would require API changes)
            yield f"data: {json.dumps({'type': 'content', 'text': content})}\n\n"
            
            if response.get('reasoning_details'):
                yield f"data: {json.dumps({'type': 'reasoning', 'text': response.get('reasoning_details')})}\n\n"
            
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)