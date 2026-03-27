import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { generateLlamaResponse } from '../lib/llama';
import { generateId } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { db, auth, handleFirestoreError, OperationType, signInWithGoogleNative } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { SEED_DATA } from '../lib/seedData';
import { MadsNeuralCore } from '../lib/madsBrain';
import { 
  collection, 
  addDoc, 
  setDoc,
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  orderBy, 
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'model';
  content: string;
  type: 'text' | 'image' | 'diagram';
  metadata?: {
    grounding?: any;
    imageUrl?: string | null;
    chartData?: any;
    reward?: string;
    searchQuery?: string | null;
  };
  createdAt: any;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export interface LearningPath {
  id: string;
  userId: string;
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'completed' | 'paused';
  createdAt: any;
  updatedAt?: any;
}

export interface LearningStep {
  id: string;
  pathId: string;
  order: number;
  title: string;
  explanation?: string;
  practiceProblem?: string;
  resources?: string[];
  status: 'locked' | 'available' | 'completed';
  userPerformance?: any;
}

export function useChat() {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [activeSteps, setActiveSteps] = useState<LearningStep[]>([]);
  const [groqApiKey, setGroqApiKey] = useState<string>(() => {
    return localStorage.getItem('mads_groq_api_key') || "";
  });

  // Initialize Neural Core
  const neuralCore = useRef(new MadsNeuralCore(knowledge));

  useEffect(() => {
    // Sync knowledge to neural core whenever it updates
    neuralCore.current.updateKnowledge(knowledge);
  }, [knowledge]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User'
        });
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    // Handle redirect result
    getRedirectResult(auth).catch((e) => {
      console.error("Redirect login error", e);
      setError("Login failed. Please try again.");
    });

    return () => unsubscribe();
  }, []);

  const [localMemory, setLocalMemory] = useState<string>(() => {
    const saved = localStorage.getItem('mads_local_memory');
    if (!saved) {
      const coreKnowledge = [
        "MADS Core: I am a God-Level Personal AI Teacher designed for deep learning.",
        "Science: Physics, Chemistry, and Biology concepts are explained using first principles.",
        "Mathematics: From Basic Arithmetic to Advanced Calculus, I focus on 'Why' before 'How'.",
        "Technology: I understand Programming, AI, and Engineering at a fundamental level.",
        "Language: I am specialized in explaining complex topics in simple, clear Bengali."
      ].join("\n- ");
      localStorage.setItem('mads_local_memory', "- " + coreKnowledge);
      return "- " + coreKnowledge;
    }
    return saved;
  });

  const isAdmin = user?.email === "an0n.lucifer.contact@gmail.com";

  const updateLocalMemory = async (topic: string, content: string) => {
    if (!user || !isAdmin) return;
    try {
      await addDoc(collection(db, 'knowledge'), {
        topic,
        content,
        source: 'user_training',
        learnedAt: serverTimestamp(),
        userId: user.id
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'knowledge');
    }
  };

  const seedDatabase = async () => {
    if (!user || !isAdmin) return;
    try {
      for (const item of SEED_DATA) {
        // Check if topic exists first to avoid duplicates
        const q = query(collection(db, 'knowledge'), where('topic', '==', item.topic));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(collection(db, 'knowledge'), {
            topic: item.topic,
            content: item.content,
            source: 'admin_seed',
            learnedAt: serverTimestamp(),
            userId: user.id
          });
        }
      }
      alert("Database seeded successfully with core scientific knowledge!");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'knowledge');
    }
  };

  const trainPhysics = async () => {
    // Deprecated in favor of seedDatabase, but kept for compatibility
    await seedDatabase();
  };

  const clearLocalMemory = () => {
    setLocalMemory("");
    localStorage.removeItem('mads_local_memory');
  };

  const createLearningPath = async (goal: string, level: 'beginner' | 'intermediate' | 'advanced') => {
    if (!user) return;
    setIsLoading(true);
    try {
      const pathId = generateId();
      const newPath: LearningPath = {
        id: pathId,
        userId: user.id,
        goal,
        level,
        status: 'active',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'learningPaths', pathId), newPath);
      
      // Generate initial steps using Llama
      const prompt = `Generate a structured learning path for the goal: "${goal}" at a ${level} level. 
      Return ONLY a JSON array of 5-7 steps. Each step MUST have: 
      "title": string, 
      "explanation": string (brief overview in clear Bengali), 
      "practiceProblem": string (one conceptual question in clear Bengali), 
      "resources": string[] (links or names of books/videos).
      The first step should be "available", others "locked".`;
      
      const response = await generateLlamaResponse(groqApiKey, prompt);
      if (response.text) {
        try {
          const jsonMatch = response.text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const stepsData = JSON.parse(jsonMatch[0]);
            for (let i = 0; i < stepsData.length; i++) {
              const stepId = generateId();
              const step: LearningStep = {
                id: stepId,
                pathId,
                order: i,
                title: stepsData[i].title,
                explanation: stepsData[i].explanation,
                practiceProblem: stepsData[i].practiceProblem,
                resources: stepsData[i].resources,
                status: i === 0 ? 'available' : 'locked'
              };
              await setDoc(doc(db, 'learningPaths', pathId, 'steps', stepId), step);
            }
          }
        } catch (e) {
          console.error("Failed to parse learning steps:", e);
        }
      }
      setActivePath(newPath);
    } catch (e) {
      console.error("Error creating learning path:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStepStatus = async (pathId: string, stepId: string, status: 'locked' | 'available' | 'completed', performance?: any) => {
    try {
      await updateDoc(doc(db, 'learningPaths', pathId, 'steps', stepId), { 
        status,
        userPerformance: performance || null
      });
      
      if (status === 'completed') {
        const currentStep = activeSteps.find(s => s.id === stepId);
        if (currentStep) {
          const nextStep = activeSteps.find(s => s.order === currentStep.order + 1);
          if (nextStep) {
            await updateDoc(doc(db, 'learningPaths', pathId, 'steps', nextStep.id), { status: 'available' });
          } else {
            await updateDoc(doc(db, 'learningPaths', pathId), { status: 'completed' });
          }
        }
      }
    } catch (e) {
      console.error("Error updating step status:", e);
    }
  };

  const deleteLearningPath = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'learningPaths', id));
      if (activePath?.id === id) setActivePath(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `learningPaths/${id}`);
    }
  };

  const updateGroqApiKey = (key: string) => {
    setGroqApiKey(key);
    localStorage.setItem('mads_groq_api_key', key);
    setError(null);
  };

  useEffect(() => {
    if (user && isAuthReady) {
      fetchConversations();
      
      const q = query(
        collection(db, 'knowledge'), 
        where('userId', '==', user.id),
        limit(100)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort client-side to avoid composite index requirement
        data.sort((a: any, b: any) => {
          const timeA = a.learnedAt?.seconds || 0;
          const timeB = b.learnedAt?.seconds || 0;
          return timeB - timeA;
        });
        setKnowledge(data);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, 'knowledge');
      });
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'learningPaths'), 
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const paths = snapshot.docs.map(doc => doc.data() as LearningPath);
        setLearningPaths(paths);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, 'learningPaths');
      });
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  useEffect(() => {
    if (activePath) {
      const q = query(
        collection(db, 'learningPaths', activePath.id, 'steps'), 
        orderBy('order', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const steps = snapshot.docs.map(doc => doc.data() as LearningStep);
        setActiveSteps(steps);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `learningPaths/${activePath.id}/steps`);
      });
      return () => unsubscribe();
    } else {
      setActiveSteps([]);
    }
  }, [activePath]);

  useEffect(() => {
    if (currentConversationId) {
      const q = query(
        collection(db, 'conversations', currentConversationId, 'messages'),
        limit(200)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        // Client-side sort to avoid index requirement
        data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB;
        });
        setMessages(data);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `conversations/${currentConversationId}/messages`);
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const login = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await signInWithGoogleNative();
        return true;
      }
      
      const provider = new GoogleAuthProvider();
      // Try popup first
      try {
        await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        console.warn("Popup blocked or failed, trying redirect", popupErr);
        // If popup is blocked or not supported, try redirect
        if (popupErr.code === 'auth/popup-blocked' || 
            popupErr.code === 'auth/operation-not-supported-in-this-environment') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupErr;
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const signup = async () => {
    return await login();
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentConversationId(null);
    setMessages([]);
  };

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'conversations'), 
        where('userId', '==', user.id),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Client-side sort to avoid index requirement
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setConversations(data);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'conversations');
    }
  };

  const fetchKnowledge = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'knowledge'), 
        where('userId', '==', user.id),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Client-side sort to avoid index requirement
      data.sort((a: any, b: any) => {
        const timeA = a.learnedAt?.seconds || 0;
        const timeB = b.learnedAt?.seconds || 0;
        return timeB - timeA;
      });
      setKnowledge(data);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'knowledge');
    }
  };

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

  const addBiologyBookContent = async (topic: string, content: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'knowledge'), {
        topic,
        content: content.slice(0, 50000), // Limit content size for Firestore
        source: 'user_upload',
        userId: user.id,
        learnedAt: serverTimestamp()
      });
      fetchKnowledge();
    } catch (e) {
      console.error("Database Error:", e);
      handleFirestoreError(e, OperationType.CREATE, 'knowledge');
    }
  };

  const uploadToLibrary = async (file: File) => {
    if (!user) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
      }
      await addDoc(collection(db, 'knowledge'), {
        topic: file.name,
        content: text.slice(0, 50000),
        source: 'pdf_upload',
        userId: user.id,
        learnedAt: serverTimestamp()
      });
      fetchKnowledge();
    } catch (e) {
      console.error("PDF Parsing Error:", e);
      handleFirestoreError(e, OperationType.CREATE, 'knowledge');
    }
  };

  const submitFeedback = async (messageId: string, isPositive: boolean) => {
    try {
      await addDoc(collection(db, 'feedback'), {
        messageId: messageId,
        isPositive: isPositive,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'feedback');
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'conversations', id));
      if (currentConversationId === id) {
        startNewConversation();
      }
      fetchConversations();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `conversations/${id}`);
    }
  };

  const renameConversation = async (id: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, 'conversations', id), { title: newTitle });
      fetchConversations();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `conversations/${id}`);
    }
  };

  const fetchTopSharedNotes = async () => {
    try {
      const q = query(collection(db, 'sharedNotes'), orderBy('upvotes', 'desc'), limit(3));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return '';
      
      let context = 'Here are some highly-rated community notes that might be relevant:\n\n';
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        context += `Topic: ${data.topic}\nAuthor: ${data.authorName}\nUpvotes: ${data.upvotes}\nContent: ${data.content}\n\n`;
      });
      return context;
    } catch (error) {
      console.error('Error fetching top shared notes:', error);
      return '';
    }
  };

  const sendMessage = async (text: string, files: { data: string; mimeType: string }[] = []) => {
    if (!user) return;
    let convId = currentConversationId;
    if (!convId) {
      convId = generateId();
      
      // Auto-generate a better title using a simple heuristic first, 
      // then we can update it later if needed.
      let title = text.split(' ').slice(0, 5).join(' ');
      if (title.length < text.length) title += '...';
      
      await setDoc(doc(db, 'conversations', convId), {
        id: convId,
        title,
        userId: user.id,
        createdAt: serverTimestamp()
      });
      setCurrentConversationId(convId);
      fetchConversations();
      
      // Fire-and-forget title generation
      if (groqApiKey) {
        generateLlamaResponse(
          groqApiKey, 
          `Generate a very short, concise title (max 4-5 words) for a conversation that starts with this message: "${text}". Return ONLY the title text, no quotes, no extra words. Respond in the same language as the message.`
        ).then(async (res) => {
          if (res.text && convId) {
            const cleanTitle = res.text.replace(/["']/g, '').trim();
            await updateDoc(doc(db, 'conversations', convId), { title: cleanTitle });
            fetchConversations();
          }
        }).catch(console.error);
      }
    }

    const userMsg: Message = {
      id: generateId(),
      conversationId: convId,
      role: 'user',
      content: text,
      type: 'text',
      createdAt: serverTimestamp() as any
    };

    await addDoc(collection(db, 'conversations', convId, 'messages'), userMsg);

    setIsLoading(true);
    setError(null);
    try {
      // Use Neural Core for response generation (No API)
      const neuralResult = await neuralCore.current.process(text);
      let responseText = neuralResult.text;
      let grounding = null;
      let rewardText = "Neural Core Processing: 100% Autonomous";
      let chartData = neuralResult.chart;
      let imageUrl = null;

      // If Neural Core doesn't know, trigger Llama (via Groq)
      if (!responseText && !neuralResult.diagramPrompt && !chartData) {
        if (!groqApiKey) {
          setError("GROQ_KEY_MISSING");
          setIsLoading(false);
          return;
        }

        try {
          const history = messages.map(m => ({
            role: m.role,
            content: m.content
          }));
          
          const communityContext = await fetchTopSharedNotes();
          const llamaResponse = await generateLlamaResponse(groqApiKey, text, history, communityContext);
          
          if (llamaResponse.error) {
            setError(llamaResponse.error);
            setIsLoading(false);
            return;
          }

          responseText = llamaResponse.text;
          rewardText = "Response generated";

          // LEARN: Save this new knowledge to the database
          if (llamaResponse.text) {
             const learnedTopic = text.length < 50 ? text : text.split(' ').slice(0, 8).join(' ') + '...';
             await addDoc(collection(db, 'knowledge'), {
              topic: learnedTopic,
              content: llamaResponse.text,
              source: 'llama_inference',
              category: 'general_science',
              learnedAt: serverTimestamp(),
              userId: user.id
            });
          }

        } catch (e) {
          responseText = "I'm sorry, I couldn't connect to the Llama server.";
          console.error("Llama API Error:", e);
        }
      } else if (neuralResult.diagramPrompt) {
        // Image generation using Pollinations AI (No API key required)
        try {
          const prompt = encodeURIComponent(neuralResult.diagramPrompt);
          // Add a random seed to avoid caching if the user asks for the same prompt
          const randomSeed = Math.floor(Math.random() * 1000000);
          imageUrl = `https://image.pollinations.ai/prompt/${prompt}?seed=${randomSeed}&width=1024&height=1024&nologo=true`;
          
          responseText = `I have generated an image for: **${neuralResult.diagramPrompt}**\n\n![${neuralResult.diagramPrompt}](${imageUrl})`;
          rewardText = "Image generated via MADS Neural Engine";
        } catch (e) {
          console.error("Image Generation Error:", e);
          responseText = `I tried to generate an image for "**${neuralResult.diagramPrompt}**", but I encountered an error. Please try again later.`;
          rewardText = "Image generation failed";
        }
      } else if (neuralResult.rawContent && !chartData) {
        // RAG with Llama context
        if (groqApiKey) {
          try {
            const history = messages.map(m => ({
              role: m.role,
              content: m.content
            }));
            
            const contextPrompt = `
              I found some potentially relevant information in my internal neural database:
              Topic: ${neuralResult.topic}
              Content: ${neuralResult.rawContent}

              User's current question: ${text}

              Instructions:
              1. Prioritize the current conversation history to understand the user's intent.
              2. If the retrieved information above is relevant to the current conversation, use it to enhance your answer.
              3. If the retrieved information is NOT relevant to the current conversation (e.g., it's about a different topic), ignore it and answer the user's question based on the conversation history and your general knowledge.
              4. Always explain in clear Bengali.
            `;
            
            const communityContext = await fetchTopSharedNotes();
            const llamaResponse = await generateLlamaResponse(groqApiKey, contextPrompt, history, communityContext);
            
            if (!llamaResponse.error) {
              responseText = llamaResponse.text;
              rewardText = "Neural Core + Llama Synthesis Active";
            }
          } catch (e) {
            console.error("Llama Contextual Error:", e);
          }
        }
      }
      
      const sanitizedMetadata = {
        grounding: grounding || null,
        imageUrl: imageUrl || null,
        chartData: chartData || null,
        reward: rewardText || null
      };

      const modelMsg: Message = {
        id: generateId(),
        conversationId: convId,
        role: 'model',
        content: responseText || "Error generating response.",
        type: 'text',
        metadata: sanitizedMetadata,
        createdAt: serverTimestamp() as any
      };

      await addDoc(collection(db, 'conversations', convId, 'messages'), modelMsg);
    } catch (error) {
      console.error(error);
      setError("Neural Core Error: " + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const deleteKnowledge = async (id: string) => {
    if (!user || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'knowledge', id));
      fetchKnowledge();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `knowledge/${id}`);
    }
  };

  // Removed performResearch as it relied on Gemini search tool
  const performResearch = async (messageId: string, queryText: string) => {
      // Placeholder if needed, or remove completely
      console.log("Research disabled in Llama mode");
  };

  return {
    user,
    login,
    signup,
    logout,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    messages,
    sendMessage,
    submitFeedback,
    deleteConversation,
    renameConversation,
    isLoading,
    error,
    clearError,
    startNewConversation,
    knowledge,
    uploadToLibrary,
    addBiologyBookContent,
    trainPhysics,
    seedDatabase,
    isAdmin,
    groqApiKey,
    updateGroqApiKey,
    localMemory,
    updateLocalMemory,
    clearLocalMemory,
    deleteKnowledge,
    performResearch,
    learningPaths,
    activePath,
    setActivePath,
    activeSteps,
    createLearningPath,
    updateStepStatus,
    deleteLearningPath
  };
}
