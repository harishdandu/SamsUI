import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

const StudentModal = ({ isOpen, onClose, onSave, student = null }) => {
  const initialState = {
    firstName: '',
    lastName: '',
    parentName: '',
    phoneNumber: '',
    class: '8',
    section: 'A',
    fees: 0,
    firstInstallmentAmount: 0,
    feeFrequency: 'Quarterly',
    tuitionStartDate: new Date().toISOString().split('T')[0],
    tuitionEndDate: '',
    paymentMethod: 'CASH'
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        parentName: student.parentName || '',
        phoneNumber: student.phoneNumber || '',
        class: student.class || '8',
        section: student.section || 'A',
        fees: student.fees?.amount || 0,
        firstInstallmentAmount: student.fees?.firstInstallmentAmount || 0,
        feeFrequency: student.fees?.feeFrequency || 'Quarterly',
        tuitionStartDate: student.fees?.tuitionStartDate ? new Date(student.fees.tuitionStartDate).toISOString().split('T')[0] : '',
        tuitionEndDate: student.fees?.tuitionEndDate ? new Date(student.fees.tuitionEndDate).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData(initialState);
    }
  }, [student, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateInstallments = () => {
    const totalFees = Number(formData.fees);
    const frequency = formData.feeFrequency;
    const startDate = new Date(formData.tuitionStartDate || new Date());
    
    let installmentCount = 0;
    let intervalMonths = 0;

    switch (frequency) {
      case 'Monthly':
        installmentCount = 10;
        intervalMonths = 1;
        break;
      case 'Quarterly':
        installmentCount = 4;
        intervalMonths = 3;
        break;
      case 'Half Yearly':
        installmentCount = 2;
        intervalMonths = 6;
        break;
      default:
        installmentCount = 1;
        intervalMonths = 0;
    }

    const installmentAmount = totalFees / installmentCount;
    const firstPaidAmount = Number(formData.firstInstallmentAmount || 0);
    const installments = [];

    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + (i * intervalMonths));

      const isFirst = i === 0;
      const paid = isFirst ? firstPaidAmount : 0;
      
      let status = 'Pending';
      if (isFirst) {
        status = firstPaidAmount >= installmentAmount ? 'Paid' : 'Partial';
      }

      installments.push({
        installmentNumber: i + 1,
        installmentAmount: installmentAmount,
        paidAmount: paid,
        installmentDueDate: dueDate.toISOString(),
        paymentStatus: status,
        paymentDate: isFirst ? new Date().toISOString() : null,
        paymentMethod: isFirst ? formData.paymentMethod : null
      });
    }

    return installments;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const installments = calculateInstallments();
      
      // Map frontend fees to backend structure
      const studentData = {
        ...formData,
        fees: { 
          amount: Number(formData.fees),
          firstInstallmentAmount: Number(formData.firstInstallmentAmount),
          feeFrequency: formData.feeFrequency,
          tuitionStartDate: formData.tuitionStartDate,
          tuitionEndDate: formData.tuitionEndDate,
          paid: Number(formData.firstInstallmentAmount || 0),
          status: Number(formData.firstInstallmentAmount || 0) >= Number(formData.fees) 
            ? 'Paid' 
            : (Number(formData.firstInstallmentAmount || 0) > 0 ? 'Partial' : 'Pending')
        },
        installments: installments // Send calculated installments to backend
      };
      await onSave(studentData);
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <div className="modal-header">
          <h2>{student ? 'Edit Student' : 'Add New Student'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                type="text" 
                name="firstName"
                className="form-input" 
                value={formData.firstName}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input 
                type="text" 
                name="lastName"
                className="form-input" 
                value={formData.lastName}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mother/Father Name</label>
              <input 
                type="text" 
                name="parentName"
                className="form-input" 
                value={formData.parentName}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="tel" 
                name="phoneNumber"
                className="form-input" 
                value={formData.phoneNumber}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Class</label>
              <select 
                name="class" 
                className="form-input" 
                value={formData.class}
                onChange={handleChange}
              >
                {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Section</label>
              <select 
                name="section" 
                className="form-input" 
                value={formData.section}
                onChange={handleChange}
              >
                {['A', 'B'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Fees ($)</label>
              <input 
                type="number" 
                name="fees"
                className="form-input" 
                value={formData.fees}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">First Installment ($)</label>
              <input 
                type="number" 
                name="firstInstallmentAmount"
                className="form-input" 
                value={formData.firstInstallmentAmount}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select 
                name="paymentMethod" 
                className="form-input" 
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="UPI">UPI</option>
                <option value="CASH">CASH</option>
                <option value="CARD">CARD</option>
              </select>
            </div>
            
            <div className="form-group full-width">
              <label className="form-label">Fee Collection Frequency</label>
              <div className="radio-group">
                {['Monthly', 'Quarterly', 'Half Yearly'].map(freq => (
                  <label key={freq} className="radio-label">
                    <input 
                      type="radio" 
                      name="feeFrequency" 
                      value={freq}
                      checked={formData.feeFrequency === freq}
                      onChange={handleChange}
                    />
                    <span>{freq}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tuition Start Date</label>
              <input 
                type="date" 
                name="tuitionStartDate"
                className="form-input" 
                value={formData.tuitionStartDate}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tuition End Date</label>
              <input 
                type="date" 
                name="tuitionEndDate"
                className="form-input" 
                value={formData.tuitionEndDate}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {student ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 2rem;
          box-shadow: var(--shadow-lg);
          position: relative;
          scrollbar-width: thin;
          scrollbar-color: var(--primary) transparent;
        }

        .modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background-color: var(--primary);
          border-radius: 10px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          position: sticky;
          top: -2rem;
          background: white;
          padding: 1rem 0;
          margin-top: -2rem;
          z-index: 10;
          border-bottom: 1px solid var(--border);
        }
        
        .modal-header h2 { margin: 0; }

        .close-btn {
          color: var(--text-secondary);
          transition: var(--transition);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover { color: var(--danger); }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .full-width {
          grid-column: span 2;
        }

        .radio-group {
          display: flex;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .radio-label input {
          width: 1.125rem;
          height: 1.125rem;
          accent-color: var(--primary);
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
          position: sticky;
          bottom: -2rem;
          background: white;
          margin-bottom: -2rem;
          padding-bottom: 2rem;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default StudentModal;
