import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Loader2 } from 'lucide-react';
import { ledgerApi } from '../utils/api';

const Ledger = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalRecords: 0
  });

  useEffect(() => {
    fetchLedgerEntries(pagination.currentPage, pagination.limit, searchTerm);
  }, [pagination.currentPage, pagination.limit, searchTerm]);

  const fetchLedgerEntries = async (page, limit, search) => {
    try {
      setLoading(true);
      const response = await ledgerApi.getAll({ params: { page, limit, search } });
      setEntries(response.data.data);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages,
        totalRecords: response.data.pagination.totalRecords
      }));
    } catch (err) {
      console.error('Error fetching ledger entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleLimitChange = (e) => {
    setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), currentPage: 1 }));
  };

  return (
    <div className="ledger-page">
      <header className="page-header">
        <div className="header-left">
          <h1>General Ledger</h1>
          <p>Complete transaction history for all student fee payments.</p>
        </div>
      </header>

      <div className="table-actions card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, marginRight: '1rem' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by student name..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
          />
        </div>
        <div className="limit-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Show:</span>
          <select 
            className="form-input" 
            style={{ width: '80px', padding: '0.25rem' }}
            value={pagination.limit}
            onChange={handleLimitChange}
          >
            {[10, 20, 50, 100].map(val => <option key={val} value={val}>{val}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading ledger records...</p>
        </div>
      ) : (
        <>
          <div className="table-container card">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Class(Section)</th>
                  <th>Installment</th>
                  <th>Due Date</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <tr key={entry._id}>
                      <td>{new Date(entry.date).toLocaleDateString()}</td>
                      <td>
                        <strong>
                          {entry.studentId 
                            ? `${entry.studentId.firstName} ${entry.studentId.lastName}` 
                            : 'N/A'}
                        </strong>
                      </td>
                      <td>
                        {entry.studentId 
                          ? `${entry.studentId.class}(${entry.studentId.section})` 
                          : 'N/A'}
                      </td>
                      <td>{entry.installmentNumber}</td>
                      <td>{new Date(entry.installmentDueDate).toLocaleDateString()}</td>
                      <td style={{ color: 'var(--success)', fontWeight: '600' }}>
                        ₹{entry.amount.toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {entry.paymentMethod}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {entry.description}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                      No ledger records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Showing {entries.length} of {pagination.totalRecords} records
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  className={`btn ${pagination.currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: '40px', padding: '0.5rem' }}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button 
                className="btn btn-secondary" 
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .search-box { display: flex; align-items: center; gap: 0.75rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: var(--radius); }
        .search-box input { border: none; background: none; outline: none; width: 100%; font-family: inherit; }
        .loading-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .card { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
        .table-container { overflow-x: auto; }
        .badge-info { background: #e0f2fe; color: #0369a1; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default Ledger;
