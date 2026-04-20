"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/council_db")

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
# PRO MODELS (COMMENTED OUT):
# COUNCIL_MODELS = [
#     "openai/gpt-5.1",
#     "google/gemini-3-pro-preview",
#     "anthropic/claude-sonnet-4.5",
#     "x-ai/grok-4",
# ]

# FREE MODELS - using free-tier OpenRouter models
# IMPORTANT: Only using models that are confirmed to work on OpenRouter free tier
COUNCIL_MODELS = [
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.3-70b-instruct",
    "meta-llama/llama-3-8b-instruct",
]

# Chairman model - synthesizes final response
# Using Gemini 2.0 Flash which is available and performant
CHAIRMAN_MODEL = "google/gemini-2.0-flash-001"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"
