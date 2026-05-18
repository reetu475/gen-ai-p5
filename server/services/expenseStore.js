import Expense from '../models/Expense.js';

export async function getExpenses() {
  return Expense.find().sort({ createdAt: -1 });
}

export async function getExpenseById(id) {
  return Expense.findById(id);
}

export async function createExpense(input) {
  const expense = new Expense(input);
  return expense.save();
}

export async function updateExpense(id, input) {
  return Expense.findByIdAndUpdate(id, input, { new: true, runValidators: true });
}

export async function deleteExpense(id) {
  return Expense.findByIdAndDelete(id);
}
