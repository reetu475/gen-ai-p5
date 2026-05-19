import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { extractExpenseText } from './services/ocrService.js';
import { createExpense, deleteExpense, getExpenseById, getExpenses, updateExpense } from './services/expenseStore.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are supported.'));
      return;
    }
    cb(null, true);
  }
});

const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean));

function isLocalhostOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || isLocalhostOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  }
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// GET all expenses
app.get('/api/expenses', async (_req, res, next) => {
  try {
    const expenses = await getExpenses();
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// GET single expense
app.get('/api/expenses/:id', async (req, res, next) => {
  try {
    const expense = await getExpenseById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// POST create expense from receipt upload
app.post('/api/expenses', upload.single('receipt'), async (req, res, next) => {
  try {
    console.log('[upload] received file:', req.file?.originalname, req.file?.mimetype, req.file?.size);
    if (!req.file) {
      return res.status(400).json({ message: 'Upload a bill or receipt image.' });
    }

    const result = await extractExpenseText({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype
    });

    const expense = await createExpense({
      vendor: result.vendor,
      amount: result.amount,
      currency: result.currency,
      purchasedAt: result.purchasedAt,
      category: result.category,
      extractedText: result.extractedText,
      sourceFileName: req.file.originalname
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

// PUT update expense
app.put('/api/expenses/:id', async (req, res, next) => {
  try {
    const expense = await updateExpense(req.params.id, req.body);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// DELETE expense
app.delete('/api/expenses/:id', async (req, res, next) => {
  try {
    const expense = await deleteExpense(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ message: 'Expense deleted.' });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error('[server error]', error.message);
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Something went wrong.'
  });
});

if (!process.env.VERCEL) {
  const server = app.listen(port, () => {
    console.log(`Expense OCR API running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Kill the process using it and restart.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

export default app;
