import { Message } from '../hooks/useChat';

// Types for the Brain
type Intent = 'GREETING' | 'QUESTION' | 'MATH' | 'CHART' | 'IMAGE' | 'UNKNOWN' | 'TRAINING_REQUEST';

interface KnowledgeItem {
  topic: string;
  content: string;
  category?: string;
}

interface ChartData {
  type: 'line' | 'bar' | 'area';
  data: any[];
  xAxis: string;
  yAxis: string;
  title: string;
}

export class MadsNeuralCore {
  private knowledgeBase: KnowledgeItem[] = [];
  private context: string[] = [];

  constructor(knowledge: KnowledgeItem[]) {
    this.knowledgeBase = knowledge;
  }

  public updateKnowledge(newKnowledge: KnowledgeItem[]) {
    this.knowledgeBase = newKnowledge;
  }

  public async process(input: string): Promise<{ text: string | null; rawContent?: string; topic?: string; chart?: ChartData; diagramPrompt?: string }> {
    const normalizedInput = input.toLowerCase().trim();
    const intent = this.detectIntent(normalizedInput);

    switch (intent) {
      case 'GREETING':
        return { text: this.generateGreeting() };
      case 'MATH':
        return { text: this.solveMath(normalizedInput) };
      case 'CHART':
        return this.generateChart(normalizedInput);
      case 'IMAGE':
        return { 
          text: null, 
          diagramPrompt: normalizedInput.replace(/(generate|make|draw|create|show|image|picture|photo|illustration|chobi)/g, '').trim() 
        };
      case 'QUESTION':
      default:
        const match = this.searchKnowledge(normalizedInput);
        if (!match) {
          // If no local knowledge, check if it sounds like a diagram request
          if (normalizedInput.match(/(diagram|illustration|chobi|picture|structure|anatomy|cycle|diagram)/)) {
            return { 
              text: null, 
              diagramPrompt: normalizedInput.replace(/(diagram|illustration|chobi|picture|generate|make|draw)/g, '').trim() 
            };
          }
          return { text: null }; // Return null to trigger external search
        }
        return { 
          text: match.content,
          rawContent: match.content,
          topic: match.topic
        };
    }
  }

  private detectIntent(input: string): Intent {
    if (input.match(/^(hi|hello|hey|salam|nomoshkar|kemon|valo|assalamu|alaikum)/)) return 'GREETING';
    
    // Image generation detection
    if (input.match(/^(generate|make|draw|create|show)\s+(image|picture|photo|illustration|chobi)/) || 
        input.match(/(image|picture|photo|illustration|chobi)\s+(generate|make|draw|create|show)/)) {
      return 'IMAGE';
    }

    // Improved Chart Detection
    if (input.match(/^(plot|graph|chart|draw)\s+/)) return 'CHART';
    
    // Improved Math Detection: Only trigger for explicit calculations or equations
    // Avoid triggering on text that just contains numbers or "derivation"
    if (input.match(/^calculate\s+/) || input.match(/^solve\s+/)) return 'MATH';
    // Only trigger math if it looks like a pure expression, not a sentence with numbers
    if (input.match(/^[\d\+\-\*\/=\(\)\.\s]+$/) && input.length < 20) return 'MATH';

    return 'QUESTION';
  }

  private generateGreeting(): string {
    const greetings = [
      "Hello! I am MADS, your advanced AI assistant. I am ready to assist you with complex problem solving, programming, and scientific discovery. How can I help you today?",
      "Greetings. MADS is online and synchronized. I am an expert in Frontend, Backend, and all core sciences. What complex problem shall we solve today?",
      "Welcome. I am MADS, a God-Level AI designed for high-level academic and professional support. I can assist with code, math, and science in both English and Bengali."
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private solveMath(input: string): string {
    try {
      const sanitized = input.replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
      if (!sanitized) return "I couldn't find a valid math expression.";
      
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + sanitized)();
      return `🧮 Neural Calculation:\n\n$$ ${sanitized} = ${result} $$`;
    } catch (e) {
      return "I encountered a syntax error in your mathematical expression.";
    }
  }

  private generateChart(input: string): { text: string; chart: ChartData } {
    // Simple function parser for y = ... or f(x) = ...
    let funcStr = input.match(/(?:y|f\(x\))\s*=\s*(.*)/)?.[1] || input.replace(/(plot|graph|chart|draw)/g, '').trim();
    
    // Default to y = x if parsing fails
    if (!funcStr) funcStr = "x";

    const data = [];
    try {
      // Create a function from the string
      const jsFuncStr = funcStr
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/log/g, 'Math.log')
        .replace(/exp/g, 'Math.exp')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/pi/g, 'Math.PI');

      // eslint-disable-next-line no-new-func
      const func = new Function('x', `return ${jsFuncStr}`);

      for (let x = -10; x <= 10; x += 0.5) {
        const y = func(x);
        if (!isNaN(y) && isFinite(y)) {
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
        }
      }

      return {
        text: `📈 **Neural Function Visualization**\n\nI have generated an interactive chart for the function: $$ y = ${funcStr} $$\n\nThis visualization helps in understanding the behavior of the function across the domain [-10, 10].`,
        chart: {
          type: 'line',
          data,
          xAxis: 'x',
          yAxis: 'y',
          title: `Graph of y = ${funcStr}`
        }
      };
    } catch (e) {
      return {
        text: "I couldn't parse that function for visualization. Please use standard math notation like `y = x^2`.",
        chart: { type: 'line', data: [], xAxis: 'x', yAxis: 'y', title: 'Error' }
      };
    }
  }

  private searchKnowledge(input: string): KnowledgeItem | null {
    // Professional self-awareness
    if (input.includes("who trained you") || input.includes("how are you trained") || input.includes("about mads")) {
      return {
        topic: "MADS Training & Architecture",
        content: "MADS (Multimodal Advanced Discovery System) is a high-level AI assistant trained on a vast corpus of scientific, mathematical, and academic data. It utilizes a hybrid architecture combining a local Neural Knowledge Base with advanced Large Language Models (like Llama 3.3) to provide accurate, professional, and context-aware responses. Its training focuses on first principles, logical reasoning, and clear communication in multiple languages, including Bengali.",
        category: "System Info"
      };
    }

    if (input.includes("bangla") || input.includes("bengali")) {
      return {
        topic: "Language Preference",
        content: "অবশ্যই! আমি আপনার সাথে বাংলাতে কথা বলতে পারি। আপনি যেকোনো প্রশ্ন বাংলাতে করতে পারেন এবং আমি তার উত্তর বাংলাতেই দেব। আমি বিজ্ঞান, গণিত এবং প্রোগ্রামিং সহ সব বিষয়ে বাংলাতে ব্যাখ্যা করতে সক্ষম।",
        category: "System Info"
      };
    }

    const stopWords = ['what', 'is', 'explain', 'the', 'a', 'an', 'in', 'on', 'ki', 'kivabe', 'holo', 'bolo', 'about', 'tell', 'me'];
    const keywords = input.split(' ')
      .filter(w => !stopWords.includes(w))
      .filter(w => w.length > 2);

    if (keywords.length === 0) return null;

    let bestMatch: KnowledgeItem | null = null;
    let maxScore = 0;

    for (const item of this.knowledgeBase) {
      let score = 0;
      const topicLower = item.topic.toLowerCase();
      const contentLower = item.content.toLowerCase();

      keywords.forEach(kw => {
        // Exact topic match is very strong
        if (topicLower === kw) score += 20;
        else if (topicLower.includes(kw)) score += 10;
        
        if (contentLower.includes(kw)) score += 1;
      });

      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    // Increased threshold to avoid weak/irrelevant matches
    if (bestMatch && maxScore > 15) {
      return bestMatch;
    }

    return null;
  }

  private handleUnknown(input: string): string {
    return `⚠️ **Data Not Found in Neural Core**\n\nI have not been trained on this specific topic yet.`;
  }
}
