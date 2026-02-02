
import { GoogleGenAI, Type } from "@google/genai";
import { SkillAnalysis, Roadmap, CalibrationQuiz, ArchitectureBlueprint } from "../types";

const API_KEY = process.env.API_KEY || "";

const getAI = () => new GoogleGenAI({ apiKey: API_KEY });

/**
 * Robust retry wrapper with exponential backoff to handle 429 Resource Exhausted errors.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED");
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function extractSkills(jd: string): Promise<string[]> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract ONLY the core technical skills from this job description. Return a flat JSON list of lowercase strings. \n\nJD:\n${jd}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]").map((s: string) => s.toLowerCase());
    } catch {
      return [];
    }
  });
}

export async function analyzeGaps(resume: string, jd: string, skills: string[]): Promise<{ analysis: SkillAnalysis[], match_score: number }> {
  return withRetry(async () => {
    const ai = getAI();
    const prompt = `
      Compare Resume vs Skills: ${skills.join(", ")}.
      Status: found/missing/partial. 
      Reasoning: Concise (max 15 words).
      Evidence: Short quote from resume.
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt}\n\nRESUME:\n${resume.slice(0, 8000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  status: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                },
                required: ['skill', 'status', 'evidence', 'reasoning']
              }
            },
            match_score: { type: Type.NUMBER }
          },
          required: ['analysis', 'match_score']
        }
      }
    });

    try {
      return JSON.parse(response.text || '{"analysis":[], "match_score":0}');
    } catch {
      return { analysis: [], match_score: 0 };
    }
  });
}

export async function generateRoadmap(skills: string[], hoursPerDay: number): Promise<Roadmap> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Create a tactical learning roadmap for these skills: ${skills.join(", ")}. Daily study: ${hoursPerDay}h. Focus on high-impact results. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            project_name: { type: Type.STRING },
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase_name: { type: Type.STRING },
                  estimated_hours: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weekly_project: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
}

export async function generateMindMapMarkdown(skills: string[]): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const prompt = `
      Generate a hierarchical Markdown Mind Map for: ${skills.join(', ')}.
      Structure it for skillX career intelligence. Group by broad domains. 
      Use # for root "skillX Profile", ## for domains, - for skills, and -- for specific sub-topics or libraries.
      Max 4 levels deep. Return ONLY markdown.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt
    });
    return response.text?.trim() || "# skillX Profile\n## Core Tech\n- " + skills.join("\n- ");
  });
}

export async function generateCalibrationQuiz(skill: string): Promise<CalibrationQuiz> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a 3-question quiz for ${skill}. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skill: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING }
                      }
                    }
                  },
                  correct: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
}

export async function getInterviewResponse(history: any[], difficulty: string): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: JSON.stringify(history),
      config: {
        systemInstruction: `You are a technical interviewer for skillX. Difficulty: ${difficulty}. Ask the next probing question. Be brief.`
      }
    });
    return response.text || "Tell me more about that.";
  });
}

export async function generateArchitecture(projectName: string, skills: string[]): Promise<ArchitectureBlueprint> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Architect "${projectName}" using: ${skills.join(", ")}. Return JSON with overview, mermaid_code (graph TD), endpoints, and decisions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            mermaid_code: { type: Type.STRING },
            api_endpoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            tech_stack_decisions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    if (data.mermaid_code) {
      data.mermaid_code = data.mermaid_code.replace(/```mermaid|```/g, "").trim();
    }
    return data;
  });
}

export async function generateCodeChallenge(skills: string[]): Promise<{ title: string, description: string, boilerplate: string }> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a coding challenge for: ${skills.join(", ")}. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            boilerplate: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
}

export async function generateScenario(skills: string[]): Promise<{ title: string, description: string, task: string }> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a crisis scenario for: ${skills.join(", ")}. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            task: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
}

export async function getScenarioFeedback(scenario: any, userResponse: string): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Feedback on this fix: ${userResponse} for crisis ${scenario.title}.`,
    });
    return response.text || "";
  });
}

export async function transcribeAudio(base64Audio: string): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { inlineData: { data: base64Audio, mimeType: 'audio/wav' } },
        { text: "Transcribe audio." }
      ]
    });
    return response.text || "";
  });
}

export async function analyzeImage(base64Image: string, prompt: string): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    });
    return response.text || "";
  });
}

export async function thinkingChat(message: string): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });
    return response.text || "";
  });
}
