import dotenv from 'dotenv';

dotenv.config();

const tracingEnabled = String(process.env.LANGSMITH_TRACING || '').toLowerCase() === 'true';

if (tracingEnabled && !process.env.LANGCHAIN_TRACING_V2) {
  process.env.LANGCHAIN_TRACING_V2 = 'true';
}

if (process.env.LANGSMITH_PROJECT && !process.env.LANGCHAIN_PROJECT) {
  process.env.LANGCHAIN_PROJECT = process.env.LANGSMITH_PROJECT;
}

export function logLangSmithStatus() {
  if (!tracingEnabled) {
    console.log('[langsmith] tracing disabled');
    return;
  }

  if (!process.env.LANGSMITH_API_KEY) {
    console.warn('[langsmith] LANGSMITH_TRACING=true but LANGSMITH_API_KEY is missing');
    return;
  }

  console.log(`[langsmith] tracing enabled for project: ${process.env.LANGSMITH_PROJECT || 'default'}`);
}
