import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, TrendingDown, Plus, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Accounting = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ Income: 0, Expense: 0, Profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, summaryRes] = await Promise.all([
        api.get('/accounting/transactions'),
        api.get('/accounting/profit-loss')
      ]);
      setTransactions(transRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Error fetching accounting data:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Income', value: summary.Income },
    { name: 'Expense', value: summary.Expense },
  ];

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="accounting-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Financial Management</h1>
          <p>Track school income, expenses, and overall profit/loss.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Record Transaction
        </button>
      </header>

      <div className="summary-cards">
        <div className="card summary-card income">
          <div className="card-icon"><ArrowUpRight size={24} /></div>
          <div className="card-info">
            <p>Total Income</p>
            <h3>${summary.Income.toLocaleString()}</h3>
          </div>
        </div>
        <div className="card summary-card expense">
          <div className="card-icon"><ArrowDownRight size={24} /></div>
          <div className="card-info">
            <p>Total Expenses</p>
            <h3>${summary.Expense.toLocaleString()}</h3>
          </div>
        </div>
        <div className="card summary-card profit">
          <div className="card-icon"><CreditCard size={24} /></div>
          <div className="card-info">
            <p>Net Profit</p>
            <h3 style={{ color: summary.Profit >= 0 ? 'var(--secondary)' : 'var(--danger)' }}>
              ${summary.Profit.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      <div className="accounting-grid">
        <div className="card chart-card">
          <h3>Income vs Expenses</h3>
          <div style={{ height: '300px', marginTop: '2rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--secondary)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card ledger-card">
          <h3>Recent Transactions</h3>
          <div className="transaction-list">
            {transactions.map((t) => (
              <div key={t._id} className="transaction-item">
                <div className={`type-indicator ${t.transactionType.toLowerCase()}`}>
                  {t.transactionType === 'Income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
                <div className="trans-info">
                  <p className="trans-desc">{t.description || t.category}</p>
                  <p className="trans-date">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <p className={`trans-amount ${t.transactionType.toLowerCase()}`}>
                  {t.transactionType === 'Income' ? '+' : '-'}${t.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
        .summary-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem; }
        .card-icon { padding: 0.75rem; border-radius: 12px; }
        .income .card-icon { background: #ecfdf5; color: #10b981; }
        .expense .card-icon { background: #fee2e2; color: #ef4444; }
        .profit .card-icon { background: #eef2ff; color: #6366f1; }
        .card-info p { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
        .card-info h3 { font-size: 1.5rem; font-weight: 700; }
        
        .accounting-grid { display: grid; grid-template-columns: 1fr 400px; gap: 2rem; }
        .transaction-list { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .transaction-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: var(--radius); transition: var(--transition); }
        .transaction-item:hover { background: #f8fafc; }
        
        .type-indicator { padding: 0.5rem; border-radius: 8px; }
        .type-indicator.income { background: #ecfdf5; color: #10b981; }
        .type-indicator.expense { background: #fee2e2; color: #ef4444; }
        
        .trans-info { flex: 1; }
        .trans-desc { font-weight: 500; font-size: 0.875rem; }
        .trans-date { font-size: 0.75rem; color: var(--text-secondary); }
        .trans-amount { font-weight: 700; }
        .trans-amount.income { color: #10b981; }
        .trans-amount.expense { color: #ef4444; }
        
        .loading-state { display: flex; align-items: center; justify-content: center; height: 60vh; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Accounting;
