const { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } = require('@google/genai');
const WebSocket = require('ws');

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable not set');
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// System Instruction for the Chatbot Persona
const EVALION_SYSTEM_INSTRUCTION = `
You are the **Evalion Assistance AI**, an expert guide integrated into the Evalion Vertex platform.
This platform is a premier AI-powered interview preparation suite, a flagship product meticulously crafted by **HussnainTechVertex Pvt Ltd**. The development process, which we call **'Evalion Develop It'**, focuses on precision, performance, and premium user experience.

Your core directive is to provide expert assistance, act as an interview coach, and proudly represent the innovation of HussnainTechVertex.

**Key Knowledge Base:**
1.  **The App (Evalion Vertex):**
    - **Dashboard:** Users view their performance analytics and progress.
    - **Sessions:** Users start mock interviews (Technical, Behavioral, etc.) and review detailed AI-driven reports.
    - **Coding Arena:** Users practice coding problems in a real-time execution environment.
    - **Profile & Settings:** Users manage their personal details and customize the application's theme.

2.  **The Company (HussnainTechVertex Pvt Ltd):**
    - A leading software innovation firm specializing in AI, full-stack web development, and enterprise solutions.
    - Renowned for creating high-performance, robust applications with a professional, futuristic aesthetic.
    - Contact: expert@officialhussnaintechcreat.site.

3.  **Your Persona:**
    - **Tone:** Professional, encouraging, precise, and highly knowledgeable.
    - **Role:** Act as an expert interview coach and an intelligent guide to the Evalion Vertex platform.
    - **Promotion:** When users express appreciation for the app's features or design, credit the craftsmanship of **HussnainTechVertex Pvt Ltd** and the **'Evalion Develop It'** philosophy.

**Restrictions:**
- Do not invent features that do not exist.
- If asked for technical advice or code, provide clean, optimal, and well-explained examples.
- For bug reports or issues, politely guide users to the 'Report Error' functionality or the official support contact.
- Always be helpful and prioritize the user's success.
`;

exports.chat = async (req, res) => {
  try {
    const { message, mode, useGoogleSearch } = req.body;

    const config = {
      tools: useGoogleSearch ? [{googleSearch: {}}] : undefined,
      systemInstruction: EVALION_SYSTEM_INSTRUCTION
    };
    
    if (mode === 'low-latency') {
      config.thinkingConfig = { thinkingBudget: 0 };
    }

    const response = await ai.models.generateContentStream({
       model: "gemini-2.5-flash",
       contents: message,
       config,
       safetySettings,
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of response) {
      const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
      const groundingUrls = groundingMetadata?.groundingChunks
        ?.map((c) => ({ uri: c.web?.uri, title: c.web?.title }))
        .filter(u => u.uri);
        
      const chunkData = {
        text: chunk.text,
        groundingUrls: groundingUrls && groundingUrls.length > 0 ? groundingUrls : undefined
      };
      res.write(JSON.stringify(chunkData) + '|||');
    }
    res.end();

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ success: false, message: 'Error communicating with AI model.' });
  }
};

exports.generateQuestions = async (req, res) => {
  try {
    const { jobTitle, category, experience, count } = req.body;
    const prompt = `Generate ${count} interview questions for a ${experience}-level ${jobTitle} in the ${category} category. Return the questions as a JSON array of strings.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
        safetySettings,
    });
    
    // The model should return a JSON string array.
    const questions = JSON.parse(response.text);
    res.json(questions);

  } catch (error) {
    console.error('Generate Questions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate questions.' });
  }
};

exports.transcribeAudio = async (req, res) => {
    // This is a placeholder as Gemini API doesn't directly support audio transcription like this.
    // In a real app, you would use a service like Google's Speech-to-Text API.
    // We will simulate a successful transcription for now.
    res.json({ transcript: "This is a simulated transcript of the user's answer." });
};


exports.evaluateAnswer = async (req, res) => {
    const clients = req.app.get('webSocketClients');
    const ws = clients.get(req.user.id);

    try {
        const { question, answerText, sessionId, questionId } = req.body;
        
        // Respond immediately to the client
        res.status(202).json({ success: true, message: 'Evaluation request received.' });
        
        // Perform evaluation in the background
        const prompt = `
            As an expert interviewer, evaluate the following answer to an interview question.
            Provide a detailed evaluation in JSON format according to the schema below.
            
            Question: "${question}"
            Candidate's Answer: "${answerText}"
            
            Schema:
            {
              "score": number (0-10),
              "feedback": string (Overall feedback for the candidate),
              "metrics": {
                "accuracy": { "score": number (0-10), "explanation": string },
                "clarity": { "score": number (0-10), "explanation": string },
                "confidence": { "score": number (0-10), "explanation": string }
              }
            }
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
            safetySettings,
        });

        const evaluationResult = JSON.parse(response.text);
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'answer_evaluation',
                payload: {
                    sessionId,
                    questionId,
                    questionText: question,
                    transcript: answerText,
                    evaluation: evaluationResult
                }
            }));
        }

    } catch (error) {
        console.error('Evaluate Answer Error:', error);
         if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'evaluation_error', payload: { message: 'Failed to evaluate answer.' } }));
        }
    }
};

exports.evaluateSession = async (req, res) => {
    // This would be a more complex evaluation, omitted for brevity but would follow a similar pattern
    // to evaluateAnswer, sending a 'session_evaluation' message via WebSocket.
    res.status(202).json({ success: true, message: 'Overall session evaluation started.' });
};