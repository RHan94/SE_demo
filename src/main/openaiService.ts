const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface UmlResponse {
  diagramTitle: string;
  diagramType: string;
  diagramCode: string;
  explanation: string;
}

interface ChatCompletion {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

function extractJsonPayload(rawContent: string): string {
  const fencedMatch = rawContent.match(/```json\s*([\s\S]+?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = rawContent.indexOf('{');
  const lastBrace = rawContent.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return rawContent.slice(firstBrace, lastBrace + 1);
  }

  throw new Error('The OpenAI response did not contain a JSON payload.');
}

export async function generateUmlFromPrompt(prompt: string): Promise<UmlResponse> {
  if (!prompt.trim()) {
    throw new Error('Prompt must not be empty.');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant that designs software architecture diagrams using UML notation expressed as Mermaid code. Respond with concise JSON.',
        },
        {
          role: 'user',
          content: `Generate a high-level UML architecture for the following request. Focus on components, responsibilities, key interactions, and data flow. Return the response as JSON with the keys diagramTitle, diagramType, diagramCode (Mermaid syntax), explanation. The Mermaid code must be valid for Mermaid 10.9.4 and use only stable diagram types (e.g. flowchart/graph, classDiagram, sequenceDiagram, stateDiagram, erDiagram). Avoid experimental syntaxes such as textMermaid or the text diagram format. Request: ${prompt}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const body = (await response.json()) as ChatCompletion;
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI API returned an empty response.');
  }

  let parsed: unknown;
  try {
    const jsonPayload = extractJsonPayload(content);
    parsed = JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${(error as Error).message}`);
  }

  const { diagramTitle, diagramType, diagramCode, explanation } = parsed as UmlResponse;
  if (!diagramCode || !diagramType) {
    throw new Error('OpenAI response is missing required fields.');
  }

  return {
    diagramTitle: diagramTitle ?? 'Architecture Diagram',
    diagramType,
    diagramCode,
    explanation: explanation ?? '',
  };
}
