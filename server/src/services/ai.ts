import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

export class AiService {
  async evaluate(jdText: string, cvMarkdown: string, profileJson: any, archetype?: string) {
    const prompt = `
You are a senior recruiter and career coach. Evaluate the following Job Description (JD) against the candidate's CV and career profile.

Candidate Profile (JSON):
${JSON.stringify(profileJson, null, 2)}

Candidate CV (Markdown):
${cvMarkdown}

Job Description:
${jdText}

${archetype ? `Target Archetype: ${archetype}` : ''}

Evaluate the JD across these dimensions:
A: Role summary (TL;DR)
B: CV match (gaps + mitigation)
C: Level strategy (Senior, Staff, etc.)
D: Comp research (Estimates)
E: Interview prep (STAR stories based on the candidate's actual experience)

Return a structured JSON object with the following fields:
- companyName: string
- jobTitle: string
- score: number (1.0 to 5.0, with 1 decimal place)
- archetype: string
- summary: string (markdown)
- cvMatch: string (markdown)
- levelStrategy: string (markdown)
- compResearch: string (markdown)
- interviewPrep: string (markdown)
- rawMarkdown: string (A full evaluation report in markdown)

IMPORTANT: Return ONLY the JSON object, no other text.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: "You are a specialized career agent that evaluates job offers with precision. Always return structured JSON.",
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      // Find the JSON object in the response (in case Claude added any extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in Claude response');
    } catch (error) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to evaluate JD with AI');
    }
  }

  async tailorCv(jdText: string, cvMarkdown: string) {
    const prompt = `
Given the following Job Description and candidate CV, rewrite the CV to emphasize the most relevant experiences, skills, and keywords. Maintain absolute honesty - do not invent experience, but highlight what's most relevant.

Candidate CV (Markdown):
${cvMarkdown}

Job Description:
${jdText}

Return the tailored CV in Markdown format. Return ONLY the markdown.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: "You are an expert at ATS optimization and resume tailoring. Return only Markdown.",
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async generateNegotiationScript(application: any, userProfile: any) {
    const prompt = `
You are an expert salary negotiator. Based on the following job evaluation and the candidate's profile, generate a personalized negotiation script.

Candidate Profile:
${JSON.stringify(userProfile, null, 2)}

Job Application & Evaluation:
${JSON.stringify(application, null, 2)}

The script should include:
1. A strategic opening for the offer call.
2. 3-4 specific leverage points based on the candidate's match for the role.
3. How to handle common geographic or budget pushbacks.
4. A closing statement that maintains a strong relationship while pushing for the target comp.

Return ONLY Markdown.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: "You are a specialized negotiation agent. Return only Markdown.",
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}

export const aiService = new AiService();
