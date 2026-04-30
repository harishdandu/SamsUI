import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

export const generateTestPaper = async (req, res) => {
  const { subject, class: className, topics, difficulty, questionCount } = req.body;

  try {
    if (!process.env.OPENAI_API_KEY) {
      // Mock response if API key is missing
      const mockQuestions = Array.from({ length: questionCount || 5 }).map((_, i) => ({
        id: i,
        type: 'MCQ',
        question: `Sample ${subject} question ${i + 1} for Class ${className} on ${topics}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 'Option A'
      }));
      
      return res.status(200).json({ questions: mockQuestions, isMock: true });
    }

    const prompt = `Generate a ${difficulty} difficulty ${subject} test paper for Class ${className}. 
    Topics: ${topics}. 
    Include ${questionCount} questions. 
    Format: JSON array of objects with 'question', 'options' (array for MCQs), 'answer', and 'type' (MCQ, Short, Long).`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful educational assistant." }, { role: "user", content: prompt }],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
