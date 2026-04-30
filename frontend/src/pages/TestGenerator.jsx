import React, { useState } from 'react';
import { Bot, Sparkles, Download, Loader2, Save, FileText } from 'lucide-react';
import api from '../utils/api';
import jsPDF from 'jspdf';

const TestGenerator = () => {
  const [formData, setFormData] = useState({
    subject: 'Science',
    class: '10',
    topics: '',
    difficulty: 'Medium',
    questionCount: 5
  });
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/generate', formData);
      setQuestions(response.data.questions);
    } catch (err) {
      console.error('Error generating test:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${formData.subject} Question Paper`, 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Class: ${formData.class} | Difficulty: ${formData.difficulty}`, 105, 30, { align: 'center' });
    
    let y = 50;
    questions.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${i+1}: ${q.question}`, 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      if (q.options) {
        q.options.forEach((opt, j) => {
          doc.text(`${String.fromCharCode(65 + j)}) ${opt}`, 30, y);
          y += 7;
        });
      } else {
        y += 15; // Space for answer
      }
      y += 10;
    });
    
    doc.save(`${formData.subject}_Test_Paper.pdf`);
  };

  return (
    <div className="test-generator-page">
      <header className="page-header">
        <div className="header-left">
          <h1>AI Test Generator</h1>
          <p>Generate high-quality question papers in seconds using AI.</p>
        </div>
      </header>

      <div className="generator-container">
        <div className="card settings-card">
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input 
              type="text" className="form-input" 
              value={formData.subject} 
              onChange={(e) => setFormData({...formData, subject: e.target.value})} 
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Class</label>
              <select className="form-input" value={formData.class} onChange={(e) => setFormData({...formData, class: e.target.value})}>
                {[10, 11, 12].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-input" value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})}>
                {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Topics / Syllabus</label>
            <textarea 
              className="form-input" rows="3" 
              placeholder="e.g. Photosynthesis, Plant cells, Respiration"
              value={formData.topics}
              onChange={(e) => setFormData({...formData, topics: e.target.value})}
            ></textarea>
          </div>
          <button className="btn btn-primary btn-generate" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate Question Paper
          </button>
        </div>

        <div className="results-container">
          {loading ? (
            <div className="card loading-placeholder">
              <Bot size={48} className="pulse" />
              <h3>AI is thinking...</h3>
              <p>Crafting unique questions for your students.</p>
            </div>
          ) : questions ? (
            <div className="card questions-card">
              <div className="results-header">
                <h3>Generated Questions</h3>
                <button className="btn btn-secondary" onClick={exportPDF}>
                  <Download size={18} /> Export PDF
                </button>
              </div>
              <div className="questions-list">
                {questions.map((q, i) => (
                  <div key={i} className="question-item">
                    <p><strong>Q{i+1}:</strong> {q.question}</p>
                    {q.options && (
                      <div className="options-grid">
                        {q.options.map((opt, j) => <div key={j} className="option">{String.fromCharCode(65+j)}) {opt}</div>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card empty-placeholder">
              <FileText size={48} color="var(--border)" />
              <p>Adjust the settings and click generate to see the magic.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .generator-container { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; align-items: start; }
        .btn-generate { width: 100%; margin-top: 1rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        
        .loading-placeholder, .empty-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem; gap: 1rem; color: var(--text-secondary); height: 100%; }
        
        .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
        .question-item { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
        .question-item:last-child { border: none; }
        .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem; }
        .option { font-size: 0.875rem; color: var(--text-secondary); background: #f8fafc; padding: 0.5rem; border-radius: 4px; }
        
        .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; color: var(--primary); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default TestGenerator;
