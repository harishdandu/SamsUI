import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Plus, Loader2, Search } from 'lucide-react';
import { feeApi } from '../utils/api';
import FeeModal from '../components/FeeModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await feeApi.getAll();
      setFees(response.data);
    } catch (err) {
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFee = async (formData) => {
    try {
      await feeApi.collect(formData);
      await fetchFees();
    } catch (err) {
      console.error('Error collecting fee:', err);
    }
  };

  const generateReceipt = (fee) => {
    const doc = new jsPDF();
    
    // Add School Header
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text('SAMS ELITE ACADEMY', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Official Fee Receipt', 105, 28, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 35, 190, 35);
    
    // Receipt Details
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(`Receipt No: ${fee.receiptNumber}`, 20, 45);
    doc.text(`Date: ${new Date(fee.createdAt).toLocaleDateString()}`, 190, 45, { align: 'right' });
    
    doc.text('Student Details:', 20, 60);
    doc.setFontSize(10);
    doc.text(`Name: ${fee.studentId.firstName} ${fee.studentId.lastName}`, 20, 68);
    doc.text(`Roll Number: ${fee.studentId.rollNumber}`, 20, 74);
    doc.text(`Class: ${fee.studentId.class}-${fee.studentId.section}`, 20, 80);
    
    // Payment Table
    doc.autoTable({
      startY: 90,
      head: [['Description', 'Payment Method', 'Status', 'Amount']],
      body: [
        ['Tuition Fees', fee.paymentMethod, fee.status, `$${fee.amount.toFixed(2)}`]
      ],
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 20, right: 20 }
    });
    
    const finalY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(14);
    doc.text(`Total Paid: $${fee.amount.toFixed(2)}`, 190, finalY + 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('This is a computer-generated receipt.', 105, 280, { align: 'center' });
    
    doc.save(`Receipt_${fee.receiptNumber}.pdf`);
  };

  const filteredFees = fees.filter(fee => {
    const firstName = fee.studentId?.firstName || '';
    const lastName = fee.studentId?.lastName || '';
    const receipt = fee.receiptNumber || '';
    
    return firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           receipt.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCollection = fees.reduce((sum, f) => sum + (f.status === 'Paid' ? f.amount : 0), 0);
  const pendingCount = fees.filter(f => f.status === 'Pending').length;

  return (
    <div className="fees-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Fee Management</h1>
          <p>Track payments, pending dues, and generate receipts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Collect Fee
        </button>
      </header>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card mini-stat">
          <p>Total Collection</p>
          <h3>${totalCollection.toLocaleString()}</h3>
        </div>
        <div className="card mini-stat">
          <p>Pending Records</p>
          <h3 style={{ color: 'var(--danger)' }}>{pendingCount}</h3>
        </div>
        <div className="card mini-stat">
          <p>Recent Payments</p>
          <h3 style={{ color: 'var(--secondary)' }}>{fees.length}</h3>
        </div>
      </div>

      <div className="table-actions card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by student name or receipt #..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading fee records...</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFees.length > 0 ? (
                filteredFees.map((fee) => (
                  <tr key={fee._id}>
                    <td><strong>#{fee.receiptNumber}</strong></td>
                    <td>
                      {fee.studentId 
                        ? `${fee.studentId.firstName} ${fee.studentId.lastName}` 
                        : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>[Deleted Student]</span>
                      }
                    </td>
                    <td>${fee.amount.toFixed(2)}</td>
                    <td>{new Date(fee.createdAt).toLocaleDateString()}</td>
                    <td>{fee.paymentMethod}</td>
                    <td>
                      <span className={`badge badge-${fee.status === 'Paid' ? 'success' : 'warning'}`}>
                        {fee.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" title="Download Receipt" onClick={() => generateReceipt(fee)}>
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <FeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCollectFee} 
      />

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .mini-stat p { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
        .mini-stat h3 { font-size: 1.5rem; font-weight: 700; }
        .search-box { display: flex; align-items: center; gap: 0.75rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: var(--radius); }
        .search-box input { border: none; background: none; outline: none; width: 100%; font-family: inherit; }
        .btn-icon { padding: 0.5rem; border-radius: var(--radius); transition: var(--transition); color: var(--primary); }
        .btn-icon:hover { background: #eef2ff; }
        .loading-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Fees;
