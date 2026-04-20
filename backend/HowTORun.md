# Install dependencies for both backend and frontend
- for backend : cd llm-council, then run :
pip install -r backend/requirements.txt 

* for backend: cd frontend, then run :
npm install

# Add OPENROUTER_API_KEY to .env 

Add in .env file in the root directory with your OpenRouter API key
# Start the backend server
run : uv run uvicorn backend.main:app --reload

# Start the frontend development server
npm run dev