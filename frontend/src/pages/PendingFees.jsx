import React, { useState, useEffect } from 'react';
import { Clock, Search, Loader2, Download, AlertCircle } from 'lucide-react';
import { feeApi } from '../utils/api';
import { toast } from 'react-hot-toast';

const PendingFees = () => {
  const [pendingFees, setPendingFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalRecords: 0
  });

  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentData, setPaymentData] = useState({
    isFullPayment: true,
    amount: '',
    paymentMethod: 'CASH'
  });

  useEffect(() => {
    fetchPendingFees(pagination.currentPage, pagination.limit, searchTerm);
  }, [pagination.currentPage, pagination.limit, searchTerm]);

  const fetchPendingFees = async (page, limit, search) => {
    try {
      setLoading(true);
      const response = await feeApi.getPending({ params: { page, limit, search } });
      setPendingFees(response.data.data);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages,
        totalRecords: response.data.pagination.totalRecords
      }));
    } catch (err) {
      console.error('Error fetching pending fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (fee) => {
    setSelectedFee(fee);
    setPaymentData({
      isFullPayment: true,
      amount: (fee.amountDue || 0).toString(),
      paymentMethod: 'CASH'
    });
    setIsModalOpen(true);
  };

  const handlePayInstallment = async () => {
    try {
      setLoading(true);
      await feeApi.payInstallment(selectedFee._id, paymentData);
      await fetchPendingFees(pagination.currentPage, pagination.limit, searchTerm);
      setIsModalOpen(false);
      toast.success('Payment processed successfully!');
    } catch (err) {
      console.error('Error paying installment:', err);
      toast.error('Failed to process payment.');
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

  const getFrequencyCount = (freq) => {
    switch (freq) {
      case 'Monthly': return 10;
      case 'Quarterly': return 4;
      case 'Half Yearly': return 2;
      default: return 1;
    }
  };

  return (
    <div className="fees-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Pending Fees</h1>
          <p>List of immediate pending installments for all students.</p>
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
            {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading pending records...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class(Section)</th>
                  <th>Amount Due</th>
                  <th>Installment</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingFees.length > 0 ? (
                  pendingFees.map((fee) => (
                    <tr key={fee._id}>
                      <td><strong>{fee.studentName}</strong></td>
                      <td>{fee.classSection}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '600' }}>₹{(fee.amountDue || 0).toLocaleString()}</td>
                      <td>{fee.installmentNumber} / {getFrequencyCount(fee.frequency)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: new Date(fee.dueDate) < new Date() ? 'var(--danger)' : 'inherit' }}>
                          {new Date(fee.dueDate) < new Date() && <AlertCircle size={14} />}
                          {new Date(fee.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${fee.paymentStatus === 'Partial' ? 'info' : 'warning'}`}>
                          {fee.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleOpenModal(fee)}
                        >
                          Pay Now
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No pending installments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Showing {pendingFees.length} of {pagination.totalRecords} records
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Process Payment</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="info-box" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Student: <strong>{selectedFee?.studentName}</strong></p>
                <p style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: '700', marginTop: '0.5rem' }}>
                  Due Amount: ₹{(selectedFee?.amountDue || 0).toLocaleString()}
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={paymentData.isFullPayment}
                    onChange={(e) => setPaymentData({ 
                      ...paymentData, 
                      isFullPayment: e.target.checked,
                      amount: e.target.checked ? (selectedFee?.amountDue || 0).toString() : ''
                    })}
                  />
                  <span>Pay Full Amount</span>
                </label>
              </div>

              {!paymentData.isFullPayment && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Enter Amount</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="Enter partial amount"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Payment Method</label>
                <select 
                  className="form-input"
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">CASH</option>
                  <option value="CARD">CARD</option>
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePayInstallment}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .search-box { display: flex; align-items: center; gap: 0.75rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: var(--radius); }
        .search-box input { border: none; background: none; outline: none; width: 100%; font-family: inherit; }
        .loading-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          width: 90%;
          max-width: 400px;
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          padding: 0;
          overflow: hidden;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 { margin: 0; font-size: 1.25rem; }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .modal-body { padding: 1.5rem; }
        .modal-footer { padding: 1.5rem; border-top: 1px solid var(--border); background: #f8fafc; }

        .checkbox-label {
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default PendingFees;
