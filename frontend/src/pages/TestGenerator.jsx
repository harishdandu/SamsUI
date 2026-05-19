import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Download, Loader2, Save, FileText, Plus, Trash2, Edit3, Eye, FileSpreadsheet, Check, CheckCircle } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { classApi, staffApi, syllabusApi } from '../utils/api';
import { toast } from 'react-hot-toast';

const TestGenerator = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [teachingSubjects, setTeachingSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  
  const [chapters, setChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [totalMarks, setTotalMarks] = useState(25);
  const [formatPrompt, setFormatPrompt] = useState('');
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [savingPaper, setSavingPaper] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [questions, setQuestions] = useState(null);
  const [editableQuestions, setEditableQuestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Tab states for the preview pane: 'edit' or 'preview'
  const [activePreviewTab, setActivePreviewTab] = useState('edit');

  // Top level screen tabs: 'generator' or 'papers'
  const [activeMainTab, setActiveMainTab] = useState('generator');
  const [savedPapers, setSavedPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);

  // Groups flat questions list by section and sorts sections by marks
  const getGroupedSections = (questionsList) => {
    const sectionsMap = {};
    questionsList.forEach(q => {
      const secName = (q.section || 'Other Questions').trim();
      if (!sectionsMap[secName]) {
        sectionsMap[secName] = {
          name: secName,
          instruction: q.sectionInstruction || '',
          marks: Number(q.marks) || 1,
          questions: []
        };
      }
      sectionsMap[secName].questions.push(q);
      
      // Keep sectionInstruction synced to first populated instance
      if (q.sectionInstruction && !sectionsMap[secName].instruction) {
        sectionsMap[secName].instruction = q.sectionInstruction;
      }
    });
    
    // Sort sections by their marks ascending, then alphabetically by section name
    return Object.values(sectionsMap).sort((a, b) => {
      if (a.marks !== b.marks) {
        return a.marks - b.marks;
      }
      return a.name.localeCompare(b.name);
    });
  };

  // Helper to flat map grouped sections back to flat array for DB save/PDF
  const getFlatGroupedQuestions = (questionsList) => {
    const grouped = getGroupedSections(questionsList);
    const flat = [];
    grouped.forEach(sec => {
      sec.questions.forEach(q => {
        flat.push({
          ...q,
          section: sec.name,
          sectionInstruction: sec.instruction
        });
      });
    });
    return flat;
  };

  useEffect(() => {
    if (user?.role === 'Teacher' && user?.staffId) {
      loadInitialData();
      fetchSavedPapers();
    } else {
      setLoadingInitial(false);
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoadingInitial(true);
      // Fetch all class documents to map class names to IDs later
      const classRes = await classApi.getAll();
      setClasses(classRes.data || []);

      // Fetch teacher teaching subjects and assigned classes
      const staffRes = await staffApi.getById(user.staffId);
      const teachingSubs = staffRes.data.teachingSubjects || [];
      
      // Standardize teaching subjects array
      const mappedSubjects = teachingSubs.map(ts => ({
        id: ts.subjectId?._id || ts.subjectId,
        name: ts.subjectId?.name || 'Teaching Subject',
        classes: ts.classes || []
      })).filter(sub => sub.id);

      setTeachingSubjects(mappedSubjects);

      if (mappedSubjects.length > 0) {
        setSelectedSubjectId(mappedSubjects[0].id);
        if (mappedSubjects[0].classes.length > 0) {
          setSelectedClassName(mappedSubjects[0].classes[0]);
        }
      }
    } catch (err) {
      console.error('Error loading teacher assignments:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchSavedPapers = async () => {
    try {
      setLoadingPapers(true);
      const token = localStorage.getItem('token');
      const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
      const response = await axios.get(`${baseUrl}/ai/papers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedPapers(response.data || []);
    } catch (err) {
      console.error('Error fetching saved papers:', err);
    } finally {
      setLoadingPapers(false);
    }
  };

  // If subject selection changes, update the className selection to the first assigned class of that subject
  useEffect(() => {
    if (selectedSubjectId) {
      const activeSub = teachingSubjects.find(sub => sub.id === selectedSubjectId);
      if (activeSub && activeSub.classes && activeSub.classes.length > 0) {
        setSelectedClassName(activeSub.classes[0]);
      } else {
        setSelectedClassName('');
      }
    }
  }, [selectedSubjectId, teachingSubjects]);

  // Load class syllabus when both subject and class selections are set
  useEffect(() => {
    if (selectedSubjectId && selectedClassName && classes.length > 0) {
      loadSyllabus();
    } else {
      setChapters([]);
      setSelectedChapters([]);
    }
  }, [selectedSubjectId, selectedClassName, classes]);

  const loadSyllabus = async () => {
    try {
      setLoadingSyllabus(true);
      setErrorMessage('');
      
      // Locate database class document ID by class name
      const targetClassObj = classes.find(c => c.name === selectedClassName);
      if (!targetClassObj) {
        setChapters([]);
        setSelectedChapters([]);
        return;
      }

      // Fetch syllabus by class ID, filtering by subject ID
      const response = await syllabusApi.getByClass(targetClassObj._id, { subjectId: selectedSubjectId });
      if (response.data && response.data.chapters) {
        setChapters(response.data.chapters);
        // Pre-select all chapters by default on fetch
        setSelectedChapters(response.data.chapters.map(ch => ch.name));
      } else {
        setChapters([]);
        setSelectedChapters([]);
        setErrorMessage('No chapters found in the syllabus.');
      }
    } catch (err) {
      console.warn('Syllabus fetch failed:', err);
      setChapters([]);
      setSelectedChapters([]);
      setErrorMessage('No syllabus has been configured for this class and subject. Please upload/create a syllabus first.');
    } finally {
      setLoadingSyllabus(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSubjectId || !selectedClassName) return;
    if (selectedChapters.length === 0) {
      toast.error('Please select at least one chapter to generate the question paper.');
      return;
    }

    setLoadingGenerate(true);
    setSavedSuccess(false);
    try {
      const currentSubjectObj = teachingSubjects.find(sub => sub.id === selectedSubjectId);
      const subjectName = currentSubjectObj ? currentSubjectObj.name : 'Subject';
      
      const payload = {
        subject: subjectName,
        class: selectedClassName,
        chapters: selectedChapters,
        difficulty,
        totalMarks,
        formatPrompt
      };

      const token = localStorage.getItem('token');
      const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
      const response = await axios.post(`${baseUrl}/ai/generate`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const parsedQuestions = response.data.questions || [];
      setQuestions(parsedQuestions);
      setEditableQuestions(parsedQuestions);
      setActivePreviewTab('edit'); // open the editor pane first
    } catch (err) {
      console.error('Error generating question paper:', err);
      toast.error(err.response?.data?.message || 'Failed to generate question paper. Please try again.');
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Add a blank question card
  const handleAddQuestion = () => {
    const uniqueSecs = Array.from(new Set(editableQuestions.map(q => q.section).filter(Boolean)));
    const defaultSection = uniqueSecs.length > 0 ? uniqueSecs[0] : 'Section B: Short Answer Questions (2 Marks Each)';
    const newQuestion = {
      id: editableQuestions.length + 1,
      type: 'Short',
      section: defaultSection,
      sectionInstruction: 'Answer as instructed',
      marks: 2,
      question: 'Provide question text here...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Model answer key detail...'
    };
    setEditableQuestions([...editableQuestions, newQuestion]);
  };

  // Remove a question card
  const handleRemoveQuestion = (index) => {
    setEditableQuestions(editableQuestions.filter((_, idx) => idx !== index));
  };

  // Update specific question field properties
  const updateQuestionField = (index, field, value) => {
    const updated = [...editableQuestions];
    updated[index][field] = value;
    setEditableQuestions(updated);
  };

  // Update specific MCQ option
  const updateQuestionOption = (qIdx, optIdx, value) => {
    const updated = [...editableQuestions];
    if (updated[qIdx].options) {
      updated[qIdx].options[optIdx] = value;
      setEditableQuestions(updated);
    }
  };

  const buildPDF = () => {
    if (editableQuestions.length === 0) return null;
    const doc = new jsPDF();
    const currentSubjectObj = teachingSubjects.find(sub => sub.id === selectedSubjectId);
    const subjectName = currentSubjectObj ? currentSubjectObj.name : 'Subject';
    
    // Header details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text("SAMS ELITE ACADEMY", 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text("Terminal Examination / Classroom Assessment", 105, 30, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);
    
    // Metadata Block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Subject: ${subjectName}`, 15, 42);
    doc.text(`Class: Class ${selectedClassName}`, 15, 47);
    doc.text(`Difficulty: ${difficulty}`, 105, 42, { align: 'center' });
    doc.text(`Total Marks: ${totalMarks} Marks`, 195, 42, { align: 'right' });
    doc.text(`Time Allowed: 2 Hours`, 195, 47, { align: 'right' });
    
    doc.setLineWidth(0.5);
    doc.line(15, 52, 195, 52);
    
    // General Instructions
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(9);
    doc.text("General Instructions: All questions are compulsory. Choice details are marked in section headers.", 15, 58);
    
    let y = 70;
    let qCounter = 1;
    const groupedSecs = getGroupedSections(editableQuestions);
    
    groupedSecs.forEach((sec) => {
      if (y > 260) { 
        doc.addPage(); 
        y = 20; 
      }
      
      // Render Section Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(sec.name.toUpperCase(), 15, y);
      y += 6;
      
      // Render Section Instruction
      if (sec.instruction) {
        doc.setFont('helvetica', 'oblique');
        doc.setFontSize(9.5);
        doc.text(`Instruction: ${sec.instruction}`, 15, y);
        y += 5;
      }
      
      doc.setLineWidth(0.2);
      doc.line(15, y - 4, 195, y - 4);
      y += 3;
      
      // Render Questions belonging to this section
      sec.questions.forEach((q) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        
        const qText = `Q${qCounter++}. ${q.question}`;
        const splitText = doc.splitTextToSize(qText, 160);
        
        doc.text(splitText, 15, y);
        
        // Mark indicator on the right
        doc.text(`[${q.marks}M]`, 195, y, { align: 'right' });
        
        y += (splitText.length * 5);
        
        doc.setFont('helvetica', 'normal');
        if (q.type === 'MCQ' && q.options) {
          q.options.forEach((opt, j) => {
            if (y > 270) { doc.addPage(); y = 20; }
            const optLetter = String.fromCharCode(65 + j);
            doc.text(`${optLetter}) ${opt}`, 25, y);
            y += 6;
          });
        } else {
          y += 12; // Free lines/space for writing answers without model answers
        }
        y += 5;
      });
    });
    
    return doc;
  };

  // Save the edited question paper to the database
  const handleSaveQuestionPaper = async () => {
    if (editableQuestions.length === 0) {
      toast.error('Please have at least one question in your question paper before saving.');
      return;
    }

    setSavingPaper(true);
    setSavedSuccess(false);
    try {
      const currentSubjectObj = teachingSubjects.find(sub => sub.id === selectedSubjectId);
      const subjectName = currentSubjectObj ? currentSubjectObj.name : 'Subject';
      
      // Compile PDF dynamically (excluding model answers) and get its base64 string
      const doc = buildPDF();
      let pdfBase64 = '';
      if (doc) {
        const dataUri = doc.output('datauristring');
        pdfBase64 = dataUri.split(',')[1]; // Extract pure base64 payload
      }

      const payload = {
        subject: subjectName,
        class: selectedClassName,
        chapters: selectedChapters,
        difficulty,
        totalMarks,
        formatPrompt,
        questions: getFlatGroupedQuestions(editableQuestions),
        pdfBase64
      };

      const token = localStorage.getItem('token');
      const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
      await axios.post(`${baseUrl}/ai/save-paper`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSavedSuccess(true);
      setQuestions(null);
      setEditableQuestions([]);
      setFormatPrompt('');
      setTotalMarks('25');
      fetchSavedPapers(); // Refresh the historical list count instantly
      toast.success('Question paper saved successfully!');
    } catch (err) {
      console.error('Error saving question paper:', err);
      toast.error(err.response?.data?.message || 'Server error while storing the question paper.');
    } finally {
      setSavingPaper(false);
    }
  };

  const handleDownloadStoredPaper = (paper) => {
    if (!paper.pdfBase64) {
      toast.error('This question paper does not have a saved PDF document. Try downloading a newly generated paper!');
      return;
    }
    const linkSource = `data:application/pdf;base64,${paper.pdfBase64}`;
    const downloadLink = document.createElement("a");
    const fileName = `${paper.subject}_Class_${paper.class}_Question_Paper.pdf`;
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  };

  if (user?.role !== 'Teacher') {
    return (
      <div className="test-generator-page page-container" style={{ padding: '2rem' }}>
        <div className="card" style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <FileText size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The AI Test Generator is only available to users with the **Teacher** role.</p>
        </div>
      </div>
    );
  }

  const currentSubjectObj = teachingSubjects.find(sub => sub.id === selectedSubjectId);
  const assignedClassesForSub = currentSubjectObj ? currentSubjectObj.classes : [];

  // Extract all unique section names currently generated/configured
  const uniqueSections = Array.from(new Set(editableQuestions.map(q => q.section).filter(Boolean)));
  if (uniqueSections.length === 0) {
    uniqueSections.push("Section A: Multiple Choice Questions (1 Mark Each)");
    uniqueSections.push("Section B: Short Answer Questions (2 Marks Each)");
    uniqueSections.push("Section C: Long Answer Questions (5 Marks Each)");
  }

  return (
    <div className="test-generator-page page-container">
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="header-left">
          <h1>AI Test Generator</h1>
          <p>Generate highly structured, premium question papers in seconds using advanced AI.</p>
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '2rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
        <button 
          onClick={() => setActiveMainTab('generator')}
          style={{ background: activeMainTab === 'generator' ? 'var(--primary)' : 'none', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold', color: activeMainTab === 'generator' ? '#fff' : 'var(--text-secondary)', transition: '0.2s' }}
        >
          <Sparkles size={18} /> Test Paper Generator
        </button>
        <button 
          onClick={() => setActiveMainTab('papers')}
          style={{ background: activeMainTab === 'papers' ? 'var(--primary)' : 'none', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold', color: activeMainTab === 'papers' ? '#fff' : 'var(--text-secondary)', transition: '0.2s' }}
        >
          <FileText size={18} /> Saved Test Papers ({savedPapers.length})
        </button>
      </div>

      {loadingInitial ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6rem' }}>
          <Loader2 size={36} className="animate-spin text-primary" style={{ color: 'var(--primary)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading teacher profiles & assignments...</p>
        </div>
      ) : activeMainTab === 'papers' ? (
        /* SAVED TEST PAPERS TAB */
        <div>
          {loadingPapers ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Retrieving your saved test papers...</p>
            </div>
          ) : savedPapers.length === 0 ? (
            <div className="card empty-placeholder" style={{ padding: '4rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <FileText size={48} color="var(--border)" style={{ marginBottom: '1rem', color: 'var(--border)' }} />
              <h3 style={{ margin: 0 }}>No Saved Question Papers Found</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Generate assessment papers using the generator tab, click "Submit & Save Paper", and they will appear here!</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1rem', marginTop: 0 }}>Saved Test Papers Catalog</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Below is the historical ledger of all question papers compiled by you. You can download the pristine, exam-ready PDF (without model answers) for any record instantly.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', background: '#f8fafc' }}>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Subject</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Class</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Difficulty</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Total Marks</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Chapters Included</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Questions</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Date Created</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedPapers.map((paper, idx) => (
                      <tr key={paper._id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{paper.subject}</td>
                        <td style={{ padding: '1rem' }}>Class {paper.class}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            background: paper.difficulty === 'Easy' ? '#dcfce7' : paper.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2',
                            color: paper.difficulty === 'Easy' ? '#166534' : paper.difficulty === 'Medium' ? '#b45309' : '#991b1b'
                          }}>
                            {paper.difficulty}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{paper.totalMarks} M</td>
                        <td style={{ padding: '1rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={paper.chapters?.join(', ')}>
                          {paper.chapters?.join(', ')}
                        </td>
                        <td style={{ padding: '1rem' }}>{paper.questions?.length || 0} Questions</td>
                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(paper.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDownloadStoredPaper(paper)}
                            className="btn"
                            disabled={!paper.pdfBase64}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', gap: '6px', alignItems: 'center', background: paper.pdfBase64 ? 'var(--primary)' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '6px', cursor: paper.pdfBase64 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                          >
                            <Download size={14} /> Download PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GENERATOR WORKSPACE TAB */
        <div className="generator-container">
          <div className="card settings-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
            
            <div className="form-group">
              <label className="form-label">Subject (Teaching Subject)</label>
              <select 
                className="form-input" 
                value={selectedSubjectId} 
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {teachingSubjects.length === 0 && <option value="">No teaching subjects assigned</option>}
                {teachingSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Class</label>
                <select 
                  className="form-input" 
                  value={selectedClassName} 
                  onChange={(e) => setSelectedClassName(e.target.value)}
                >
                  {assignedClassesForSub.length === 0 && <option value="">No classes assigned</option>}
                  {assignedClassesForSub.map((cName) => (
                    <option key={cName} value={cName}>Class {cName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select 
                  className="form-input" 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Total Marks</label>
              <input 
                type="number" 
                className="form-input"
                min="5"
                max="100"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Select Chapters to Include</label>
                {chapters.length > 0 && (
                  <button 
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', padding: 0 }}
                    onClick={() => {
                      if (selectedChapters.length === chapters.length) {
                        setSelectedChapters([]);
                      } else {
                        setSelectedChapters(chapters.map(ch => ch.name));
                      }
                    }}
                  >
                    {selectedChapters.length === chapters.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              
              {loadingSyllabus ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: '0.85rem' }}>Fetching syllabus chapters...</span>
                </div>
              ) : errorMessage ? (
                <div style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', color: '#b45309', fontSize: '0.825rem' }}>
                  {errorMessage}
                </div>
              ) : chapters.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No chapters found.</p>
              ) : (
                <div className="chapters-checklist-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', background: '#f8fafc' }}>
                  {chapters.map((ch, idx) => {
                    const isChecked = selectedChapters.includes(ch.name);
                    return (
                      <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          style={{ marginTop: '3px' }}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedChapters(selectedChapters.filter(name => name !== ch.name));
                            } else {
                              setSelectedChapters([...selectedChapters, ch.name]);
                            }
                          }}
                        />
                        <span>{ch.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Custom Format Guidelines (Prompt details)</label>
              <textarea 
                className="form-input" rows="5" 
                placeholder="e.g. Generate 5 questions of 1 mark (MCQs), 3 questions of 2 marks (Short answers), and 2 questions of 5 marks (Long answers). All questions should be focused on conceptual clarity."
                value={formatPrompt}
                onChange={(e) => setFormatPrompt(e.target.value)}
              ></textarea>
            </div>

            <button 
              className="btn btn-primary btn-generate" 
              onClick={handleGenerate} 
              disabled={loadingGenerate || loadingSyllabus || chapters.length === 0}
              style={{ width: '100%', marginTop: '1.25rem' }}
            >
              {loadingGenerate ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Generate Question Paper
            </button>
          </div>

          <div className="results-container">
            {loadingGenerate ? (
              <div className="card loading-placeholder">
                <Bot size={48} className="pulse" />
                <h3>AI is drafting your exam paper...</h3>
                <p>Curating precise, high-quality assessment questions matching CBSE guidelines.</p>
              </div>
            ) : questions ? (
              <div className="card questions-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                
                <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Generated Question Paper Workspace</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>You can edit, add, or delete any question before storing to the database.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn" 
                      onClick={handleSaveQuestionPaper}
                      disabled={savingPaper || editableQuestions.length === 0}
                      style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 'bold' }}
                    >
                      {savingPaper ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Submit & Save Paper
                    </button>
                  </div>
                </div>

                {savedSuccess && (
                  <div style={{ padding: '1rem', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <CheckCircle size={20} color="#166534" />
                    <span>Question paper successfully saved and stored in the database!</span>
                  </div>
                )}

                {/* Sub tabs: 'edit' or 'preview' */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <button 
                    onClick={() => setActivePreviewTab('edit')}
                    style={{ background: activePreviewTab === 'edit' ? '#f1f5f9' : 'none', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 'bold', color: activePreviewTab === 'edit' ? 'var(--primary)' : 'var(--text-secondary)' }}
                  >
                    <Edit3 size={16} /> Interactive Editor ({editableQuestions.length})
                  </button>
                  <button 
                    onClick={() => setActivePreviewTab('preview')}
                    style={{ background: activePreviewTab === 'preview' ? '#f1f5f9' : 'none', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 'bold', color: activePreviewTab === 'preview' ? 'var(--primary)' : 'var(--text-secondary)' }}
                  >
                    <Eye size={16} /> Board Exam Preview
                  </button>
                </div>

                {activePreviewTab === 'edit' ? (
                  <div className="interactive-editor-workspace" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={handleAddQuestion}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={16} /> Add Question Card
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setEditableQuestions(getFlatGroupedQuestions(editableQuestions))}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Sort and group workspace questions by sections"
                      >
                        <FileSpreadsheet size={16} /> Sort & Group Workspace
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {editableQuestions.map((q, idx) => {
                        const isInSectionList = uniqueSections.includes(q.section);
                        return (
                          <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', background: '#f8fafc', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1rem' }}>Q{idx + 1}</span>
                                <select 
                                  value={q.type}
                                  onChange={(e) => updateQuestionField(idx, 'type', e.target.value)}
                                  style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                                >
                                  <option value="MCQ">MCQ</option>
                                  <option value="Blank">Fill In The Blanks</option>
                                  <option value="Short">Short Answer</option>
                                  <option value="Long">Long Answer</option>
                                </select>
                              </div>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Marks:</span>
                                  <input 
                                    type="number"
                                    value={q.marks}
                                    onChange={(e) => updateQuestionField(idx, 'marks', Number(e.target.value))}
                                    style={{ width: '50px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'center', fontSize: '0.85rem' }}
                                  />
                                </div>
                                <button 
                                  onClick={() => handleRemoveQuestion(idx)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                                  title="Remove Question"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                              <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Section Name</span>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                                  <select
                                    value={isInSectionList ? q.section : '__CUSTOM__'}
                                    style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1, borderRadius: '6px', border: '1px solid var(--border)' }}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '__CUSTOM__') {
                                        updateQuestionField(idx, 'section', 'New Section Name');
                                      } else {
                                        updateQuestionField(idx, 'section', val);
                                      }
                                    }}
                                  >
                                    {uniqueSections.map((sec, sIdx) => (
                                      <option key={sIdx} value={sec}>{sec}</option>
                                    ))}
                                    <option value="__CUSTOM__">+ Create Custom Section...</option>
                                  </select>
                                  
                                  {(!isInSectionList || q.section === '') && (
                                    <input 
                                      type="text"
                                      className="form-input"
                                      value={q.section}
                                      style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }}
                                      placeholder="Type section name..."
                                      onChange={(e) => updateQuestionField(idx, 'section', e.target.value)}
                                    />
                                  )}
                                </div>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Section Choice Instruction</span>
                                <input 
                                  type="text"
                                  className="form-input"
                                  value={q.sectionInstruction || ''}
                                  style={{ padding: '0.4rem', fontSize: '0.85rem', marginTop: '3px' }}
                                  placeholder="e.g. Answer any 10 out of 12 questions"
                                  onChange={(e) => updateQuestionField(idx, 'sectionInstruction', e.target.value)}
                                />
                              </div>
                            </div>

                            <div style={{ marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Question text</span>
                              <textarea 
                                rows="2"
                                className="form-input"
                                value={q.question}
                                style={{ padding: '0.5rem', fontSize: '0.9rem', marginTop: '3px' }}
                                onChange={(e) => updateQuestionField(idx, 'question', e.target.value)}
                              />
                            </div>

                            {q.type === 'MCQ' && q.options && (
                              <div style={{ marginBottom: '0.75rem', padding: '0.75rem', border: '1px dashed var(--border)', borderRadius: '6px', background: '#fff' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Options (For MCQs)</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '4px' }}>
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{String.fromCharCode(65 + optIdx)})</span>
                                      <input 
                                        type="text"
                                        value={opt}
                                        style={{ padding: '0.3rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', flex: 1 }}
                                        onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Model Answer / Key</span>
                              <textarea 
                                rows="1"
                                className="form-input"
                                value={q.answer}
                                style={{ padding: '0.4rem', fontSize: '0.85rem', marginTop: '3px' }}
                                onChange={(e) => updateQuestionField(idx, 'answer', e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      className="btn btn-secondary" 
                      onClick={handleAddQuestion}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'center', marginTop: '1rem' }}
                    >
                      <Plus size={16} /> Add Question Card
                    </button>
                  </div>
                ) : (
                  <div className="exam-paper-style" style={{ border: '2px solid #000', padding: '2rem', background: '#fff', color: '#000', fontFamily: 'serif' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <h2 style={{ margin: '0 0 0.25rem 0', fontFamily: 'serif', fontWeight: 'bold' }}>SAMS ELITE ACADEMY</h2>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontFamily: 'serif' }}>Terminal Assessment / Classroom Examination</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        <span>Subject: {currentSubjectObj ? currentSubjectObj.name : 'Subject'}</span>
                        <span>Class: Class {selectedClassName}</span>
                        <span>Marks: {totalMarks} M</span>
                      </div>
                    </div>

                    <div className="questions-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {(() => {
                        const groupedSecs = getGroupedSections(editableQuestions);
                        let qCounter = 1;
                        return groupedSecs.map((sec, secIdx) => (
                          <div key={secIdx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ marginBottom: '0.25rem', marginTop: '1.25rem' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '1rem', borderBottom: '1px double #000', paddingBottom: '0.25rem' }}>
                                {sec.name.toUpperCase()}
                              </div>
                              {sec.instruction && (
                                <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>
                                  Instruction: {sec.instruction}
                                </div>
                              )}
                            </div>
                            
                            {sec.questions.map((q, i) => {
                              const qNum = qCounter++;
                              return (
                                <div key={i} className="preview-question-item">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                    <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>Q{qNum}.</strong> {q.question}</p>
                                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>[{q.marks} Marks]</span>
                                  </div>
                                  {q.type === 'MCQ' && q.options && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                                      {q.options.map((opt, j) => (
                                        <div key={j} style={{ fontSize: '0.9rem' }}>
                                          {String.fromCharCode(65 + j)}) {opt}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {q.answer && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderLeft: '3px solid var(--primary)', fontSize: '0.825rem', color: '#0f172a' }}>
                                      <strong>Model Answer:</strong> {q.answer}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card empty-placeholder">
                <FileText size={48} color="var(--border)" />
                <p>Configure the exam parameters on the left sidebar and click "Generate Question Paper" to compile the test.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .generator-container { display: grid; grid-template-columns: 360px 1fr; gap: 2rem; align-items: start; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        
        .loading-placeholder, .empty-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem; gap: 1rem; color: var(--text-secondary); height: 100%; min-height: 400px; border: 1px dashed var(--border); border-radius: 12px; }
        
        .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; color: var(--primary); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default TestGenerator;
