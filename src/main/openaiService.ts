const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface UmlResponse {
  diagramTitle: string;
  diagramType: string;
  diagramCode: string;
  explanation: string;
}

export interface CodeResponse {
  language: string;
  code: string;
  explanation: string;
}

export interface CodeGenerationRequest {
  prompt: string;
  diagramType: string;
  diagramCode: string;
  explanation?: string;
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

export async function generateCodeFromUml(request: CodeGenerationRequest): Promise<CodeResponse> {
  const { prompt, diagramType, diagramCode, explanation } = request;

  if (!diagramCode.trim()) {
    throw new Error('Diagram code must not be empty.');
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
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a senior software engineer who translates UML architecture into high-quality implementation scaffolds. Respond with concise JSON only.',
        },
        {
          role: 'user',
          content: [
            'Generate implementable starter code that aligns with this UML design.',
            `Original request: ${prompt}`,
            `Diagram type: ${diagramType}`,
            explanation ? `Explanation from UML generator: ${explanation}` : '',
            'UML diagram (Mermaid syntax):',
            diagramCode,
            '',
            'Return JSON with keys: language (programming language used), code (single multi-file friendly code block), explanation (brief notes on major components).',
            'Prefer mainstream languages (TypeScript, Java, Python, etc.) that best match the architecture. Include necessary scaffolding and key classes or modules.',
          ]
            .filter(Boolean)
            .join('\n'),
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

  const { language, code, explanation: codeExplanation } = parsed as { language: unknown; code: unknown; explanation?: unknown };
  const normalizedLanguage =
    typeof language === 'string' && language.trim().length > 0 ? language.trim() : 'Unknown language';
  const normalizedCode = normalizeCodePayload(code);
  const normalizedExplanation = typeof codeExplanation === 'string' ? codeExplanation : '';

  if (!normalizedCode) {
    throw new Error('OpenAI response did not include usable code output.');
  }

  return {
    language: normalizedLanguage,
    code: normalizedCode,
    explanation: normalizedExplanation,
  };
}

function normalizeCodePayload(raw: unknown): string {
  if (typeof raw === 'string') {
    return cleanCodeFence(raw);
  }

  if (Array.isArray(raw)) {
    const joined = raw
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        try {
          return JSON.stringify(item, null, 2);
        } catch {
          return String(item);
        }
      })
      .join('\n\n');
    return cleanCodeFence(joined);
  }

  if (raw && typeof raw === 'object') {
    try {
      return cleanCodeFence(JSON.stringify(raw, null, 2));
    } catch {
      return cleanCodeFence(String(raw));
    }
  }

  return '';
}

function cleanCodeFence(code: string): string {
  const trimmed = code.trim();

  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  const fenceMatch = trimmed.match(/^```[\w-]*\s*([\s\S]*?)\s*```$/);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trimEnd();
  }

  return trimmed;
}
