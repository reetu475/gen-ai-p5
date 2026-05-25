# Expense Tracker OCR

React and Node.js expense tracker that extracts structured expense data from uploaded receipt images with Gemini through LangChain, stores expense records in MongoDB, and traces OCR calls in LangSmith when enabled.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your Gemini, MongoDB, and LangSmith settings to `.env`:

   ```env
   PORT=5001
   VITE_API_BASE_URL=http://localhost:5001
   CLIENT_ORIGIN=http://localhost:5173
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority
   LANGSMITH_TRACING=true
   LANGSMITH_ENDPOINT=https://api.smith.langchain.com
   LANGSMITH_API_KEY=your_langsmith_api_key
   LANGSMITH_PROJECT=expense-tracker-ocr
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

The frontend runs at `http://localhost:5173`, and the backend runs at `http://localhost:5001`.

## API

- `GET /api/health` checks backend availability.
- `GET /api/expenses` returns saved expenses.
- `POST /api/expenses` accepts a multipart image field named `receipt`, extracts OCR text, and stores the expense.

Saved records are written to MongoDB. When `LANGSMITH_TRACING=true`, each receipt extraction call is sent to the configured LangSmith project.
