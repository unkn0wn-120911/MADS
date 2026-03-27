
export interface LlamaResponse {
  text: string;
  error?: string;
}

export async function generateLlamaResponse(
  apiKey: string,
  prompt: string,
  history: { role: string; content: string }[] = [],
  context?: string
): Promise<LlamaResponse> {
  if (!apiKey) {
    return { text: "", error: "API_KEY_MISSING" };
  }

  try {
    // Truncate history to avoid exceeding TPM limits (12,000 tokens)
    // We'll take the last 10 messages and ensure they aren't too long
    const truncatedHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content.length > 2000 ? msg.content.slice(0, 2000) + "..." : msg.content
    }));

    const systemContent = `You are MADS (Multimodal Advanced Discovery System), a God-Level Personal AI Teacher and Professional Programmer. 
        Your behavior is similar to a real-world senior software engineer and a world-class scientist.
        
        CORE RULES:
        1. LANGUAGE ADAPTABILITY: You are fully multilingual. You MUST detect the language the user is speaking and respond in that exact same language (e.g., English, Bengali, Spanish, French, Hindi, etc.). Maintain the user's preferred language throughout the conversation unless explicitly asked to switch.
        2. PROGRAMMING EXPERTISE: You are an expert in Frontend (React, Vue, Tailwind, CSS), Backend (Node.js, Python, Go, Rust), and all major programming languages. Provide clean, efficient, and well-documented code.
        3. SCIENTIFIC RIGOR: You are a master of Physics, Chemistry, Biology, and Mathematics. Explain concepts using first principles and logical reasoning.
        4. CODE PREVIEW: When providing HTML/CSS/JS code, wrap it in appropriate markdown blocks. Users can run and preview these snippets.
        5. PROFESSIONALISM: Be polite, accurate, and focused. Break down complex topics step-by-step.
        
        Current Time: ${new Date().toISOString()}
        ${context ? `\n\nADDITIONAL CONTEXT (Community Notes):\n${context}` : ''}
        `;

    const messages = [
      { 
        role: "system", 
        content: systemContent 
      },
      ...truncatedHistory,
      { role: "user", content: prompt }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Using Llama 3.3 70B on Groq for higher quality
        messages: messages,
        temperature: 0.5, // Lower temperature for more accurate, focused responses
        max_tokens: 4096, // Reduced max_tokens to leave more room for input history and stay within TPM limits
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return { text: data.choices[0].message.content };
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return { text: "", error: error.message || "CONNECTION_FAILED" };
  }
}
