import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = '';

function formatMoney(expense) {
  if (!expense.amount) return 'Amount unknown';
  const currency = expense.currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(expense.amount);
  } catch {
    return `${currency} ${expense.amount}`;
  }
}

function EditModal({ expense, onSave, onClose }) {
  const [form, setForm] = useState({
    vendor: expense.vendor || '',
    amount: expense.amount || '',
    currency: expense.currency || '',
    purchasedAt: expense.purchasedAt || '',
    category: expense.category || ''
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(expense._id, { ...form, amount: Number(form.amount) || null });
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Expense</h2>
        {['vendor', 'amount', 'currency', 'purchasedAt', 'category'].map((field) => (
          <label key={field} className="modal-field">
            <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
            <input name={field} value={form[field]} onChange={handleChange} />
          </label>
        ))}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/expenses`)
      .then((r) => r.json())
      .then((data) => {
        setExpenses(data);
        setSelectedExpense(data[0] || null);
      })
      .catch(() => setError('Could not load saved expenses.'));
  }, []);

  useEffect(() => {
    if (!file) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) { setError('Choose a receipt image first.'); return; }
    setIsUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('receipt', file);
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Receipt processing failed.');
      setExpenses((current) => [data, ...current]);
      setSelectedExpense(data);
      setFile(null);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      setExpenses((current) => current.filter((e) => e._id !== id));
      setSelectedExpense((prev) => (prev?._id === id ? null : prev));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(id, updates) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed.');
      setExpenses((current) => current.map((e) => (e._id === id ? data : e)));
      setSelectedExpense((prev) => (prev?._id === id ? data : prev));
      setEditingExpense(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="upload-panel">
          <div>
            <p className="eyebrow">Receipt OCR</p>
            <h1>Expense Tracker</h1>
            <p className="lede">Upload a receipt image, extract clean text, and save the expense details.</p>
          </div>

          <form onSubmit={handleSubmit} className="upload-form">
            <label className="drop-zone">
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {previewUrl
                ? <img src={previewUrl} alt="Selected receipt preview" />
                : <span>Choose bill or receipt image</span>}
            </label>
            <button type="submit" disabled={isUploading}>
              {isUploading ? 'Extracting text...' : 'Extract text and save'}
            </button>
          </form>

          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="results-panel">
          <div className="summary-row">
            <div><span>Total saved</span><strong>{expenses.length}</strong></div>
            <div><span>Known spend</span><strong>{total.toFixed(2)}</strong></div>
          </div>

          <section className="text-result">
            <div className="section-heading">
              <h2>Extracted Text</h2>
              {selectedExpense?.vendor && <span>{selectedExpense.vendor}</span>}
            </div>
            <pre>{selectedExpense?.extractedText || 'Upload a receipt to see extracted text here.'}</pre>
          </section>
        </div>
      </section>

      <section className="expense-list">
        <div className="section-heading">
          <h2>Saved Expenses</h2>
          <span>{expenses.length} records</span>
        </div>

        <div className="expense-grid">
          {expenses.map((expense) => (
            <div
              className={`expense-card ${selectedExpense?._id === expense._id ? 'active' : ''}`}
              key={expense._id}
              onClick={() => setSelectedExpense(expense)}
            >
              <span>{expense.vendor || 'Unknown vendor'}</span>
              <strong>{formatMoney(expense)}</strong>
              <small>{expense.purchasedAt || expense.sourceFileName}</small>
              <div className="card-actions">
                <button
                  className="btn-edit"
                  onClick={(e) => { e.stopPropagation(); setEditingExpense(expense); }}
                  type="button"
                >Edit</button>
                <button
                  className="btn-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(expense._id); }}
                  type="button"
                >Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {editingExpense && (
        <EditModal
          expense={editingExpense}
          onSave={handleUpdate}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
