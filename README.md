# Expense Tracker OCR

React and Node.js expense tracker that extracts readable text from uploaded receipt images with the OpenAI SDK, stores expense records in a JSON database, and displays saved OCR results dynamically.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your OpenAI API key to `.env`:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4.1-mini
   PORT=5001
   CLIENT_ORIGIN=http://localhost:5173
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

Saved records are written to `server/data/expenses.json`.
