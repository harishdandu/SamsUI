import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Upload, Loader2, Save, Trash2, Plus, GripVertical } from 'lucide-react';
import '../styles/Syllabus.css';
import { classApi, subjectApi, staffApi, syllabusApi } from '../utils/api';

const Syllabus = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [file, setFile] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syllabusId, setSyllabusId] = useState(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState(null);
  const [uploadedFileType, setUploadedFileType] = useState(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('manage');
  const [mySyllabuses, setMySyllabuses] = useState([]);
  const [loadingMySyllabuses, setLoadingMySyllabuses] = useState(false);
  const [expandedSyllabusId, setExpandedSyllabusId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchSyllabus(selectedClass, selectedSubject);
    } else {
      setChapters([]);
      setSyllabusId(null);
      setUploadedFileBase64(null);
      setUploadedFileType(null);
      setUploadedPdfUrl(null);
    }
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    if (activeTab === 'view-all') {
      fetchMySyllabuses();
    }
  }, [activeTab]);

  const fetchMySyllabuses = async () => {
    try {
      setLoadingMySyllabuses(true);
      const response = await syllabusApi.getMySyllabuses();
      setMySyllabuses(response.data);
    } catch (error) {
      console.error('Error fetching my syllabuses:', error);
    } finally {
      setLoadingMySyllabuses(false);
    }
  };

  const downloadBase64File = (base64Data, fileName, mimeType) => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType || 'application/pdf' });
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'syllabus.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Download Error:", e);
      alert("Failed to download file: " + e.message);
    }
  };

  const fetchInitialData = async () => {
    try {
      const classRes = await classApi.getAll();
      let availableClasses = classRes.data;

      if (user?.role === 'Teacher' && user?.staffId) {
        const staffRes = await staffApi.getById(user.staffId);
        const teachingSubs = staffRes.data.teachingSubjects || [];
        
        // Extract unique subjects
        const teacherSubjects = teachingSubs.map(ts => ({
          _id: ts.subjectId?._id || ts.subjectId,
          name: ts.subjectId?.name || 'Assigned Subject'
        }));
        
        const uniqueSubjects = [];
        const map = new Map();
        for (const item of teacherSubjects) {
          if (item._id && !map.has(item._id.toString())) {
            map.set(item._id.toString(), true);
            uniqueSubjects.push(item);
          }
        }
        setSubjects(uniqueSubjects);
        if (uniqueSubjects.length > 0) {
          setSelectedSubject(uniqueSubjects[0]._id);
        }

        // Extract assigned classes from teachingSubjects
        const teacherClassNames = new Set(teachingSubs.flatMap(ts => ts.classes));
        availableClasses = availableClasses.filter(c => teacherClassNames.has(c.name));
        setClasses(availableClasses);

      } else {
        // Admin logic
        setClasses(availableClasses);

        const subjRes = await subjectApi.getAll();
        setSubjects(subjRes.data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchSyllabus = async (classId, subjectId) => {
    try {
      setLoading(true);
      const response = user?.role === 'Teacher'
        ? await syllabusApi.getByClass(classId)
        : await syllabusApi.getByClass(classId, { subjectId });
        
      if (response.data) {
        setChapters(response.data.chapters || []);
        setSyllabusId(response.data._id);
        // Clear pending upload data since we loaded from DB
        setUploadedFileBase64(null);
        setUploadedFileType(null);
        setUploadedPdfUrl(null);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setChapters([]);
        setSyllabusId(null);
        setUploadedFileBase64(null);
        setUploadedFileType(null);
        setUploadedPdfUrl(null);
      } else {
        console.error('Error fetching syllabus:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedClass) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10MB limit. Please upload a smaller file.");
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('classId', selectedClass);

    try {
      setLoading(true);
      const response = await syllabusApi.upload(formData);
      
      const syllabusData = response.data.syllabus;
      setChapters(syllabusData.chapters);
      
      // Store the extracted file data in state until the user clicks Save
      setUploadedFileBase64(syllabusData.fileBase64);
      setUploadedFileType(syllabusData.fileType);
      setUploadedPdfUrl(syllabusData.pdfUrl);
      
      setFile(null);
      alert('Syllabus extracted successfully! Review and click "Save Changes" to save it.');
    } catch (error) {
      console.error('Error uploading syllabus:', error);
      alert(error.response?.data?.message || 'Error extracting syllabus');
    } finally {
      setLoading(false);
    }
  };

  const handleChapterChange = (index, value) => {
    const newChapters = [...chapters];
    newChapters[index].name = value;
    setChapters(newChapters);
  };

  const removeChapter = (index) => {
    const newChapters = chapters.filter((_, i) => i !== index);
    setChapters(newChapters);
  };

  const addChapter = () => {
    setChapters([...chapters, { name: 'New Chapter/Topic', subtopics: [] }]);
  };

  const handleSubtopicChange = (cIndex, sIndex, value) => {
    const newChapters = [...chapters];
    if (!newChapters[cIndex].subtopics) newChapters[cIndex].subtopics = [];
    newChapters[cIndex].subtopics[sIndex].name = value;
    setChapters(newChapters);
  };

  const removeSubtopic = (cIndex, sIndex) => {
    const newChapters = [...chapters];
    newChapters[cIndex].subtopics = newChapters[cIndex].subtopics.filter((_, i) => i !== sIndex);
    setChapters(newChapters);
  };

  const addSubtopic = (cIndex) => {
    const newChapters = [...chapters];
    if (!newChapters[cIndex].subtopics) newChapters[cIndex].subtopics = [];
    newChapters[cIndex].subtopics.push({ name: 'New Subtopic' });
    setChapters(newChapters);
  };

  const saveSyllabus = async () => {
    if (!selectedClass || !selectedSubject) return;
    try {
      setSaving(true);
      const payload = {
        classId: selectedClass,
        subjectId: selectedSubject,
        chapters,
        fileBase64: uploadedFileBase64,
        fileType: uploadedFileType,
        pdfUrl: uploadedPdfUrl
      };

      if (syllabusId) {
        await syllabusApi.update(syllabusId, payload);
      } else {
        const response = await syllabusApi.create(payload);
        setSyllabusId(response.data.syllabus._id);
      }
      
      // Clear pending upload data and reset session state as it's now saved
      setChapters([]);
      setSyllabusId(null);
      setUploadedFileBase64(null);
      setUploadedFileType(null);
      setUploadedPdfUrl(null);
      setSelectedClass("");
      if (user?.role !== 'Teacher') {
        setSelectedSubject("");
      }
      
      alert('Syllabus saved successfully!');
    } catch (error) {
      console.error('Error updating syllabus:', error);
      alert('Error updating syllabus');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="syllabus-container page-container">
      <div className="page-header">
        <div>
          <h1>Class Syllabus</h1>
          <p>Upload and configure syllabus for your classes</p>
        </div>
      </div>

      <div className="syllabus-tabs">
        <button 
          className={`syllabus-tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Syllabus
        </button>
        <button 
          className={`syllabus-tab ${activeTab === 'view-all' ? 'active' : ''}`}
          onClick={() => setActiveTab('view-all')}
        >
          View Syllabuses
        </button>
      </div>

      {activeTab === 'manage' ? (
        <div className="syllabus-content">
          <div className="syllabus-sidebar">
            <div className="card class-selector">
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <h3>Select Subject</h3>
                  <select 
                    className="form-select" 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={user?.role === 'Teacher'}
                  >
                    <option value="">Select a subject...</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <h3>Select Class</h3>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select a class...</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>Class {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedClass && (
              <div className="card upload-section">
                <h3>Upload Document</h3>
                <p className="help-text">Upload a PDF syllabus and AI will extract the chapters for you.</p>
                
                <form onSubmit={handleFileUpload} className="upload-form">
                  <div className="file-drop-area">
                    <Upload size={32} color="var(--primary)" />
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => {
                        const selectedFile = e.target.files[0];
                        if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
                          alert("File size exceeds the 10MB limit. Please select a smaller file.");
                          e.target.value = null; // reset input
                          setFile(null);
                          return;
                        }
                        setFile(selectedFile);
                      }}
                      id="syllabus-file"
                    />
                    <label htmlFor="syllabus-file">
                      {file ? file.name : "Choose PDF file or drag & drop"}
                    </label>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100" 
                    disabled={!file || loading}
                  >
                    {loading ? (
                      <><Loader2 size={18} className="spin" /> Processing AI...</>
                    ) : (
                      <><BookOpen size={18} /> Extract Chapters</>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="syllabus-main">
            {loading && !chapters.length ? (
              <div className="loading-state">
                <Loader2 size={40} className="spin text-primary" />
                <p>Loading syllabus data...</p>
              </div>
            ) : selectedClass ? (
              <div className="card chapters-card">
                <div className="chapters-header">
                  <h3>Chapters & Topics</h3>
                  {chapters.length > 0 && (
                    <button 
                      className="btn btn-primary" 
                      onClick={saveSyllabus}
                      disabled={saving}
                    >
                      {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                      Save Changes
                    </button>
                  )}
                </div>

                {chapters.length === 0 ? (
                  <div className="empty-state">
                    <BookOpen size={48} className="text-muted" />
                    <p>No syllabus found for this class.</p>
                    <p className="text-sm">Upload a PDF to let AI generate it, or add manually.</p>
                    <button className="btn btn-outline" onClick={addChapter}>
                      <Plus size={18} /> Add Chapter Manually
                    </button>
                  </div>
                ) : (
                  <div className="chapters-list">
                    {chapters.map((chapter, index) => (
                      <div key={index} className="chapter-item">
                        <div className="chapter-content">
                          <div className="chapter-main-row">
                            <div className="drag-handle">
                              <GripVertical size={20} className="text-muted" />
                            </div>
                            <div className="chapter-number">{index + 1}</div>
                            <input 
                              type="text" 
                              value={chapter.name}
                              onChange={(e) => handleChapterChange(index, e.target.value)}
                              className="form-input chapter-input"
                              placeholder="Chapter Name"
                            />
                            <button 
                              className="btn-icon text-muted" 
                              onClick={() => addSubtopic(index)}
                              title="Add subtopic"
                            >
                              <Plus size={18} />
                            </button>
                            <button 
                              className="btn-icon btn-danger-light" 
                              onClick={() => removeChapter(index)}
                              title="Remove chapter"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {chapter.subtopics && chapter.subtopics.length > 0 && (
                            <div className="subtopics-list">
                              {chapter.subtopics.map((sub, sIndex) => (
                                <div key={sIndex} className="subtopic-item">
                                  <div className="subtopic-number">{index + 1}.{sIndex + 1}</div>
                                  <input 
                                    type="text" 
                                    value={sub.name}
                                    onChange={(e) => handleSubtopicChange(index, sIndex, e.target.value)}
                                    className="form-input chapter-input"
                                    placeholder="Subtopic Name"
                                  />
                                  <button 
                                    className="btn-icon btn-danger-light" 
                                    onClick={() => removeSubtopic(index, sIndex)}
                                    title="Remove subtopic"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-add-chapter" onClick={addChapter}>
                      <Plus size={18} /> Add Topic
                    </button>
                  </div>
                )}
              </div>
            ) : (
               <div className="empty-state card full-height">
                 <BookOpen size={48} className="text-muted" />
                 <p>Please select a class to view or configure its syllabus.</p>
               </div>
            )}
          </div>
        </div>
      ) : (
        <div className="syllabuses-list-container">
          {loadingMySyllabuses ? (
            <div className="loading-state card">
              <Loader2 className="spin text-primary" size={40} />
              <p>Loading your syllabuses...</p>
            </div>
          ) : mySyllabuses.length === 0 ? (
            <div className="empty-state card">
              <BookOpen size={48} className="text-muted" />
              <p>You haven't configured any syllabuses yet.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('manage')}>Create One Now</button>
            </div>
          ) : (
            <div className="syllabuses-grid">
              {mySyllabuses.map((s) => (
                <div className="syllabus-card" key={s._id}>
                  <div className="syllabus-card-header">
                    <div>
                      <span className="badge-class">Class {s.classId?.name || 'Unknown'}</span>
                      <h3 className="subject-title">{s.subjectName || 'No Subject Assigned'}</h3>
                    </div>
                    <BookOpen size={24} color="var(--primary)" />
                  </div>
                  <div className="syllabus-card-body">
                    <p><strong>Chapters:</strong> {s.chapters?.length || 0} main chapters configured.</p>
                    {s.pdfUrl && <p className="pdf-url-tag">📄 {s.pdfUrl}</p>}

                    {expandedSyllabusId === s._id && (
                      <div className="syllabus-chapters-preview" style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Chapters & Subtopics</h4>
                        <div className="chapters-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                          {s.chapters.map((ch, chIdx) => (
                            <div key={chIdx} className="chapter-preview-item">
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                {ch.name}
                              </div>
                              {ch.subtopics && ch.subtopics.length > 0 && (
                                <div style={{ marginLeft: '1rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {ch.subtopics.map((sub, subIdx) => (
                                    <div key={subIdx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                      • {sub.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="syllabus-card-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedClass(s.classId?._id || '');
                        setSelectedSubject(s.subjectId || '');
                        setActiveTab('manage');
                      }}
                    >
                      Edit Syllabus
                    </button>
                    
                    <button 
                      className={`btn btn-outline btn-sm ${expandedSyllabusId === s._id ? 'active' : ''}`}
                      onClick={() => setExpandedSyllabusId(expandedSyllabusId === s._id ? null : s._id)}
                    >
                      {expandedSyllabusId === s._id ? "Hide Chapters" : "View Chapters"}
                    </button>

                    {s.fileBase64 && (
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => downloadBase64File(s.fileBase64, s.pdfUrl || 'syllabus.pdf', s.fileType)}
                      >
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Syllabus;
