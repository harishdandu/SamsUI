import OpenAI from 'openai';
import dotenv from 'dotenv';
import QuestionPaper from '../models/QuestionPaper.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

export const generateTestPaper = async (req, res) => {
  const { subject, class: className, chapters, difficulty, totalMarks, formatPrompt } = req.body;

  try {
    const chaptersStr = Array.isArray(chapters) ? chapters.join(', ') : (chapters || 'All chapters');
    
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key') {
      // Build a realistic mock question paper based on difficulty, subject, and chapters!
      const mockQuestions = [];
      let currentId = 1;
      
      const selectedChapters = Array.isArray(chapters) && chapters.length > 0 
        ? chapters 
        : ['Chapter 1: Core Principles', 'Chapter 2: Practical Applications'];

      // Section A: MCQs (1 Mark each)
      mockQuestions.push({
        id: currentId++,
        type: 'MCQ',
        section: 'Section A: Multiple Choice Questions (1 Mark Each)',
        marks: 1,
        question: `Which of the following is the fundamental unit/concept studied under ${selectedChapters[0].split(':')[0]}?`,
        options: ['Option A: Basic Element', 'Option B: Standard Form', 'Option C: Interactive Agent', 'Option D: Derived Constant'],
        answer: 'Option A: Basic Element'
      });

      mockQuestions.push({
        id: currentId++,
        type: 'MCQ',
        section: 'Section A: Multiple Choice Questions (1 Mark Each)',
        marks: 1,
        question: `How does difficulty level ${difficulty} impact the primary methodologies of ${subject}?`,
        options: ['Option A: Minimal deviation', 'Option B: High sensitivity configuration', 'Option C: Standard linear response', 'Option D: Non-linear chaotic distribution'],
        answer: 'Option B: High sensitivity configuration'
      });

      // Section B: Short Answer (2 Marks each)
      mockQuestions.push({
        id: currentId++,
        type: 'Short',
        section: 'Section B: Short Answer Questions (2 Marks Each)',
        marks: 2,
        question: `Explain the relationship between the key concepts of ${selectedChapters[0]} and ${selectedChapters[1] || 'advanced applications'}.`,
        answer: `Conceptual answer explaining how the foundational theories outlined in the syllabus chapters intersect directly under a ${difficulty} environment.`
      });

      mockQuestions.push({
        id: currentId++,
        type: 'Short',
        section: 'Section B: Short Answer Questions (2 Marks Each)',
        marks: 2,
        question: `State two primary applications or equations related to ${subject} in Class ${className}.`,
        answer: 'Provides the two core equations/applications as taught in standard CBSE syllabus guides.'
      });

      // Section C: Long Answer (5 Marks each)
      mockQuestions.push({
        id: currentId++,
        type: 'Long',
        section: 'Section C: Long Answer Questions (5 Marks Each)',
        marks: 5,
        question: `With the help of a detailed diagram or structured explanation, describe the system architecture/mechanism of ${selectedChapters[0]}. Highlight how this is verified experimentally.`,
        answer: 'A comprehensive detailed layout showing step-by-step verification, theoretical proof, and graphical plots as required for high marks.'
      });

      return res.status(200).json({ questions: mockQuestions, isMock: true });
    }

    const prompt = `
      You are an expert school board examiner. Generate a professional question paper for:
      - Subject: ${subject}
      - Class: ${className}
      - Difficulty: ${difficulty}
      - Syllabus Chapters to Include: ${chaptersStr}
      - Total Marks: ${totalMarks || 50}
      
      Strictest Guidelines for Question Counts and Section Layout:
      The teacher has provided these specific structural and count instructions:
      "${formatPrompt}"
      
      You MUST strictly satisfy the following requirements:
      1. Adhere EXACTLY to the requested number of questions for each type/mark. For example, if asked for 12 questions of 2 marks, you must output exactly 12 question objects of 2 marks. If asked for 5 MCQs and 5 fill in the blanks, generate exactly 5 MCQs and 5 fill in the blanks.
      2. If "fill in the blanks" questions are requested, set their "type" to "Blank" and do not provide "options" for them.
      3. Identify and construct clear instructions for each section matching the teacher's guidelines (e.g., "Answer any 10 out of 12 questions", "Answer all 10 questions (5 MCQs, 5 Fill in the blanks)", "Answer any 4 out of 6 questions"). Include this instruction in the "sectionInstruction" field for every question in that section.
      
      Generate a JSON object with a single property "questions" which is an array of objects.
      Each question object MUST have:
      - "id": A sequential integer starting from 1
      - "type": "MCQ", "Blank", "Short", or "Long"
      - "section": The section name (e.g., "Section A: Multiple Choice Questions (1 Mark Each)", "Section B: Short Answer Questions (2 Marks Each)", "Section C: Long Answer Questions (5 Marks Each)")
      - "sectionInstruction": The exact choice instructions for that section (e.g., "Answer all questions", "Answer any 10 out of 12 questions", "Answer any 4 out of 6 questions")
      - "marks": A number representing the marks allocated to this question
      - "question": The exact question text. For "Blank" type, include a blank like "_______" in the question text.
      - "options": An array of 4 option strings (ONLY if type is MCQ, otherwise omit or return null)
      - "answer": A brief model answer or correct option string (for MCQs, the correct option name; for Blanks, the correct fill-in word)
      
      Make sure to return only pure JSON. Do not wrap in markdown or standard text.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful education assistant designed to output pure JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveQuestionPaper = async (req, res) => {
  const { subject, class: className, chapters, difficulty, totalMarks, formatPrompt, questions, pdfBase64 } = req.body;
  const schoolId = req.user.schoolId;
  const userId = req.user._id;

  try {
    const newPaper = new QuestionPaper({
      subject,
      class: className,
      chapters,
      difficulty,
      totalMarks,
      formatPrompt,
      questions,
      pdfBase64,
      createdBy: userId,
      schoolId
    });

    await newPaper.save();
    res.status(201).json({ message: 'Question paper saved successfully!', paper: newPaper });
  } catch (error) {
    console.error('Error saving question paper:', error);
    res.status(500).json({ message: 'Server error while saving question paper: ' + error.message });
  }
};

export const getQuestionPapers = async (req, res) => {
  const schoolId = req.user.schoolId;
  const userId = req.user._id;

  try {
    let query = { schoolId };
    if (req.user.role === 'Teacher') {
      query.createdBy = userId;
    }
    const papers = await QuestionPaper.find(query).sort({ createdAt: -1 });
    res.status(200).json(papers);
  } catch (error) {
    console.error('Error fetching question papers:', error);
    res.status(500).json({ message: 'Server error while fetching question papers' });
  }
};
