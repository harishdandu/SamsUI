import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant designed to output pure JSON." },
        { role: "user", content: "Extract chapters from: 1. Math intro. Return as a JSON object with a single property 'chapters' which is an array of objects. Each object should have a single field 'name'." }
      ],
      response_format: { type: "json_object" }
    });
    console.log(completion.choices[0].message.content);
  } catch (err) {
    console.error(err);
  }
}
test();
