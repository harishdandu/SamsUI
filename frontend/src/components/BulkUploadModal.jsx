import React, { useState } from 'react';
import { X, Upload, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const BulkUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Parent Name': 'Richard Doe',
        'Phone Number': '9876543210',
        'Class': '8',
        'Section': 'A',
        'Total Fees': 50000,
        'First Installment Paid': 15000,
        'Fee Frequency': 'Quarterly',
        'Tuition Start Date': '2026-06-01',
        'Tuition End Date': '2027-03-31',
        'Payment Method': 'CASH'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    // Add validation instructions or notes if possible, or just download
    XLSX.writeFile(workbook, 'SAMS_Student_Registration_Template.xlsx');
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
          setPreview(null);
          return;
        }

        setPreview({
          count: json.length,
          data: json
        });
      } catch (err) {
        setError('Failed to parse Excel file. Please use the provided template.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preview) return;

    setLoading(true);
    setError(null);
    try {
      // Map Excel data to API structure
      const mappedData = preview.data.map(row => ({
        firstName: row['First Name'],
        lastName: row['Last Name'],
        parentName: row['Parent Name'],
        phoneNumber: row['Phone Number']?.toString(),
        class: row['Class']?.toString(),
        section: row['Section']?.toString(),
        fees: {
          amount: Number(row['Total Fees']),
          firstInstallmentAmount: Number(row['First Installment Paid']),
          feeFrequency: row['Fee Frequency'],
          tuitionStartDate: row['Tuition Start Date'],
          tuitionEndDate: row['Tuition End Date']
        },
        paymentMethod: row['Payment Method'] || 'CASH'
      }));

      await onUploadComplete(mappedData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register students. Check your data and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content card bulk-upload-modal">
        <div className="modal-header">
          <h2>Bulk Student Registration</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="template-section">
            <div className="info-box">
              <AlertCircle size={20} />
              <p>Please use our official template to ensure all student data is correctly formatted.</p>
            </div>
            <button className="btn btn-secondary" onClick={downloadTemplate}>
              <Download size={18} />
              Download Excel Template
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={`upload-zone ${file ? 'has-file' : ''}`}>
              <input 
                type="file" 
                id="excel-upload" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange}
                className="hidden-input"
              />
              <label htmlFor="excel-upload" className="upload-label">
                <Upload size={32} />
                {file ? (
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <strong>Click to upload</strong> or drag and drop
                    <span>Excel files only (.xlsx, .xls)</span>
                  </div>
                )}
              </label>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {preview && !error && (
              <div className="preview-info">
                <CheckCircle2 size={18} />
                <span>Ready to register <strong>{preview.count}</strong> students from this file.</span>
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!preview || loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {loading ? 'Processing...' : 'Register Students'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .bulk-upload-modal { width: 100%; max-width: 550px; padding: 2rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        
        .template-section { background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 2rem; text-align: center; }
        .info-box { display: flex; gap: 0.75rem; align-items: center; text-align: left; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem; }
        .info-box svg { color: var(--primary); flex-shrink: 0; }
        
        .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius); transition: var(--transition); cursor: pointer; }
        .upload-zone:hover { border-color: var(--primary); background: #f5f7ff; }
        .upload-zone.has-file { border-color: var(--secondary); background: #f0fdf4; border-style: solid; }
        .hidden-input { display: none; }
        
        .upload-label { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 1rem; cursor: pointer; }
        .upload-label svg { color: var(--text-secondary); }
        .upload-zone.has-file svg { color: var(--secondary); }
        
        .upload-prompt { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; font-size: 0.9375rem; color: var(--text-primary); }
        .upload-prompt span { font-size: 0.75rem; color: var(--text-secondary); }
        
        .file-info { display: flex; flex-direction: column; align-items: center; }
        .file-name { font-weight: 600; color: var(--text-primary); }
        .file-size { font-size: 0.75rem; color: var(--text-secondary); }
        
        .preview-info { display: flex; align-items: center; gap: 0.5rem; color: var(--secondary); font-size: 0.875rem; margin-top: 1.5rem; justify-content: center; }
        .error-message { display: flex; align-items: center; gap: 0.5rem; color: var(--danger); font-size: 0.875rem; margin-top: 1.5rem; justify-content: center; }
        
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BulkUploadModal;
