const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testAI() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
    const result = await model.generateContent([{ text: 'Hello!' }]);
    const response = await result.response;
    console.log(response.text());
  } catch (e) {
    console.error(e);
  }
}

testAI();
