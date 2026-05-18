import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    vendor: { type: String, default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    purchasedAt: { type: String, default: null },
    category: { type: String, default: null },
    extractedText: { type: String, default: '' },
    sourceFileName: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
