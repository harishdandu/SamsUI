import React, { useState } from 'react';
import { X, Upload, Download, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const BulkStaffUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const downloadTemplate = () => {
    const templateData = [
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@school.com',
        'Phone Number': '9876543211',
        'Role': 'Teacher',
        'Gender': 'Female',
        'Basic Salary': 35000,
        'Join Date': '01/06/2026',
        'Casual Leaves': 12,
        'Sick Leaves': 10,
        'Other Leaves': 5
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staffs');
    XLSX.writeFile(workbook, 'SAMS_Staff_Registration_Template.xlsx');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          selectedFile.type !== 'application/vnd.ms-excel') {
        setError('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          setError('The uploaded file is empty.');
          setStaffData([]);
          return;
        }

        const parseDate = (dateStr) => {
          if (!dateStr) return new Date().toISOString().split('T')[0];
          if (typeof dateStr === 'number') {
             const date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
             return date.toISOString().split('T')[0];
          }
          if (typeof dateStr === 'string') {
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
              }
            } else if (dateStr.includes('-')) {
               return dateStr;
            }
          }
          return new Date().toISOString().split('T')[0];
        };

        const mappedData = json.map((row, index) => ({
          id: index,
          firstName: row['First Name'] || '',
          lastName: row['Last Name'] || '',
          email: row['Email'] || '',
          phone: row['Phone Number']?.toString() || '',
          role: row['Role'] || 'Teacher',
          gender: row['Gender'] || '',
          basicSalary: Number(row['Basic Salary'] || 0),
          joinDate: parseDate(row['Join Date']),
          casualLeaves: Number(row['Casual Leaves'] || 0),
          sickLeaves: Number(row['Sick Leaves'] || 0),
          otherLeaves: Number(row['Other Leaves'] || 0)
        }));

        setStaffData(mappedData);
        setIsEditing(true);
      } catch (err) {
        setError('Failed to parse Excel file. Please use the provided template.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCellChange = (id, field, value) => {
    setStaffData(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeRow = (id) => {
    setStaffData(prev => prev.filter(item => item.id !== id));
  };

  const duplicates = React.useMemo(() => {
    const emailCounts = {};
    const phoneCounts = {};
    
    staffData.forEach(row => {
      const emailStr = row.email?.toLowerCase().trim();
      if (emailStr) emailCounts[emailStr] = (emailCounts[emailStr] || 0) + 1;
      const phoneStr = row.phone?.toString().trim();
      if (phoneStr) phoneCounts[phoneStr] = (phoneCounts[phoneStr] || 0) + 1;
    });

    const duplicateEmails = new Set(Object.keys(emailCounts).filter(e => emailCounts[e] > 1));
    const duplicatePhones = new Set(Object.keys(phoneCounts).filter(p => phoneCounts[p] > 1));

    return { emails: duplicateEmails, phones: duplicatePhones };
  }, [staffData]);

  const hasDuplicates = duplicates.emails.size > 0 || duplicates.phones.size > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (staffData.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      // Final mapping to match DB structure before sending
      const finalMappedData = staffData.map(({ id, basicSalary, ...rest }) => ({
        ...rest,
        salary: { base: basicSalary } // Map basicSalary to salary.base
      }));

      await onUploadComplete(finalMappedData);
      onClose();
      resetModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register staff. Check your data and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setStaffData([]);
    setIsEditing(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-content card bulk-upload-modal ${isEditing ? 'wide-modal' : ''}`}>
        <div className="modal-header">
          <h2>Bulk Staff Registration</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {!isEditing ? (
            <>
              <div className="template-section">
                <div className="info-box">
                  <AlertCircle size={20} />
                  <p>Download our template to ensure staff data is correctly formatted.</p>
                </div>
                <button className="btn btn-secondary" onClick={downloadTemplate}>
                  <Download size={18} />
                  Download Staff Template
                </button>
              </div>

              <div className={`upload-zone ${file ? 'has-file' : ''}`}>
                <input 
                  type="file" 
                  id="staff-excel-upload" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileChange}
                  className="hidden-input"
                />
                <label htmlFor="staff-excel-upload" className="upload-label">
                  <Upload size={32} />
                  <div className="upload-prompt">
                    <strong>Click to upload</strong> or drag and drop
                    <span>Excel files only (.xlsx, .xls)</span>
                  </div>
                </label>
              </div>
            </>
          ) : (
            <div className="preview-container">
              <div className="preview-header">
                <h3>Preview and Edit Data ({staffData.length} Staff)</h3>
                <button className="btn btn-secondary btn-sm" onClick={resetModal}>
                  Change File
                </button>
              </div>
              
              {hasDuplicates && (
                <div className="duplicate-warning">
                  <AlertCircle size={18} />
                  Please resolve duplicate emails or phone numbers before registering.
                </div>
              )}

              <div className="table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Gender</th>
                      <th>Join Date</th>
                      <th>Salary</th>
                      <th>Casual L.</th>
                      <th>Sick L.</th>
                      <th>Other L.</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input 
                            type="text" 
                            value={row.firstName} 
                            onChange={(e) => handleCellChange(row.id, 'firstName', e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={row.lastName} 
                            onChange={(e) => handleCellChange(row.id, 'lastName', e.target.value)} 
                          />
                        </td>
                        <td className={duplicates.emails.has(row.email?.toLowerCase().trim()) ? 'duplicate-error' : ''}>
                          <input 
                            type="email" 
                            value={row.email} 
                            onChange={(e) => handleCellChange(row.id, 'email', e.target.value)} 
                          />
                        </td>
                        <td className={duplicates.phones.has(row.phone?.toString().trim()) ? 'duplicate-error' : ''}>
                          <input 
                            type="text" 
                            value={row.phone} 
                            onChange={(e) => handleCellChange(row.id, 'phone', e.target.value)} 
                          />
                        </td>
                        <td>
                          <select 
                            value={row.role} 
                            onChange={(e) => handleCellChange(row.id, 'role', e.target.value)}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Teacher">Teacher</option>
                            <option value="HR">HR</option>
                            <option value="Accountant">Accountant</option>
                          </select>
                        </td>
                        <td>
                          <select 
                            value={row.gender || ''} 
                            onChange={(e) => handleCellChange(row.id, 'gender', e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                        <td>
                          <input 
                            type="date" 
                            value={row.joinDate} 
                            onChange={(e) => handleCellChange(row.id, 'joinDate', e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="num-input"
                            value={row.basicSalary} 
                            onChange={(e) => handleCellChange(row.id, 'basicSalary', e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="num-input"
                            value={row.casualLeaves} 
                            onChange={(e) => handleCellChange(row.id, 'casualLeaves', e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="num-input"
                            value={row.sickLeaves} 
                            onChange={(e) => handleCellChange(row.id, 'sickLeaves', e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="num-input"
                            value={row.otherLeaves} 
                            onChange={(e) => handleCellChange(row.id, 'otherLeaves', e.target.value)} 
                          />
                        </td>
                        <td>
                          <button className="btn-icon text-danger" onClick={() => removeRow(row.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            {isEditing && (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={loading || staffData.length === 0 || hasDuplicates}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {loading ? 'Registering...' : 'Register All Staff'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .bulk-upload-modal { width: 100%; max-width: 550px; padding: 2rem; transition: all 0.3s ease; max-height: 90vh; overflow-y: auto; position: relative; }
        .bulk-upload-modal.wide-modal { max-width: 1200px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        
        .template-section { background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 2rem; text-align: center; }
        .info-box { display: flex; gap: 0.75rem; align-items: center; text-align: left; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem; }
        .info-box svg { color: var(--primary); flex-shrink: 0; }
        
        .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius); transition: var(--transition); cursor: pointer; }
        .upload-zone:hover { border-color: var(--primary); background: #f5f7ff; }
        .hidden-input { display: none; }
        .upload-label { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 1rem; cursor: pointer; }
        .upload-prompt { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; font-size: 0.9375rem; color: var(--text-primary); }
        .upload-prompt span { font-size: 0.75rem; color: var(--text-secondary); }
        
        .preview-container { margin-top: 1rem; }
        .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .preview-header h3 { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); }
        
        .table-wrapper { 
          max-height: 400px; 
          overflow-y: auto; 
          overflow-x: auto;
          border: 1px solid var(--border); 
          border-radius: var(--radius);
          background: #f8fafc;
        }
        .preview-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; white-space: nowrap; }
        .preview-table th { 
          position: sticky; top: 0; background: #f1f5f9; color: var(--text-secondary); 
          text-align: left; padding: 0.75rem 0.5rem; font-weight: 600; z-index: 1;
        }
        .preview-table td { padding: 0.35rem 0.5rem; border-top: 1px solid var(--border); background: white; }
        .preview-table input, .preview-table select {
          width: 100%; min-width: 100px; padding: 0.35rem; border: 1px solid transparent; border-radius: 4px;
          font-family: inherit; font-size: 0.8125rem; transition: all 0.2s;
        }
        .preview-table input[type="email"] { min-width: 180px; }
        .preview-table input.num-input { min-width: 70px; width: 70px; }
        .preview-table input:hover, .preview-table select:hover { border-color: var(--border); background: #f8fafc; }
        .preview-table input:focus, .preview-table select:focus { 
          border-color: var(--primary); background: white; outline: none; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
        
        .duplicate-error input { border-color: var(--danger) !important; background-color: #fef2f2 !important; color: var(--danger) !important; }
        .duplicate-warning { display: flex; align-items: center; gap: 0.5rem; background: #fef2f2; border: 1px solid #fca5a5; color: var(--danger); padding: 0.75rem; border-radius: var(--radius); margin-bottom: 1rem; font-size: 0.875rem; }

        .btn-icon.text-danger { color: var(--danger); }
        .btn-icon.text-danger:hover { background: #fee2e2; }
        
        .error-message { display: flex; align-items: center; gap: 0.5rem; color: var(--danger); font-size: 0.875rem; margin-top: 1.5rem; justify-content: center; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BulkStaffUploadModal;
