const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Chatbot API Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;
    
    // Check if the API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({ 
        error: { message: 'API key is not configured on the server.' } 
      });
    }

    // Map messages to Gemini format
    const geminiContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system || 'You are a helpful AI assistant.' }]
        },
        contents: geminiContents
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json(data);
    }

    // Format the response back to what the frontend expects
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't fetch a response right now.";
    
    res.json({
      content: [{ text: responseText }]
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: { message: 'An internal server error occurred.' } });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
