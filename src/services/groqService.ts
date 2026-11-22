// Groq Cloud AI service for the Kisumu mental health referral and linkage tool
// Supports OpenAI GPT-OSS-120B / GPT-OSS-20B via Groq Cloud

export const DEFAULT_GROQ_KEY = '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';
export const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT OSS 120B (High Reasoning - Recommended)' },
  { id: 'openai/gpt-oss-20b', name: 'OpenAI GPT OSS 20B (Ultra-fast Decision Support)' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B' },
];

export function getGroqApiKey(): string {
  const custom = localStorage.getItem('kisumu_groq_api_key');
  if (custom && custom.trim().length > 0) return custom.trim();
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  if (envKey && envKey.trim().length > 0) return envKey.trim();
  return DEFAULT_GROQ_KEY;
}

export function setGroqApiKey(key: string): void {
  if (!key || key.trim() === '') {
    localStorage.removeItem('kisumu_groq_api_key');
  } else {
    localStorage.setItem('kisumu_groq_api_key', key.trim());
  }
}

export function getGroqModel(): string {
  const custom = localStorage.getItem('kisumu_groq_model');
  if (custom && custom.trim().length > 0) return custom.trim();
  const envModel = import.meta.env.VITE_GROQ_MODEL;
  if (envModel && envModel.trim().length > 0) return envModel.trim();
  return DEFAULT_MODEL;
}

export function setGroqModel(model: string): void {
  localStorage.setItem('kisumu_groq_model', model);
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callGroqChat(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  const model = options?.model || getGroqModel();
  const apiKey = getGroqApiKey();
  const temperature = options?.temperature ?? 0.2;
  const max_tokens = options?.max_tokens ?? 1200;

  // First try serverless proxy endpoint if hosted on Vercel
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model, temperature, max_tokens }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    }
  } catch {
    // If /api/chat is not available (local Vite preview or direct client call), proceed to direct Groq API
  }

  // Direct client call to Groq Cloud API
  const directResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!directResponse.ok) {
    const errText = await directResponse.text();
    let parsedErr = '';
    try {
      const json = JSON.parse(errText);
      parsedErr = json.error?.message || errText;
    } catch {
      parsedErr = errText;
    }
    throw new Error(`Groq API error (${directResponse.status}): ${parsedErr}`);
  }

  const result = await directResponse.json();
  const output = result.choices?.[0]?.message?.content;
  if (!output) {
    throw new Error('No content returned from Groq API');
  }
  return output;
}

export async function testGroqConnection(): Promise<{ ok: boolean; latencyMs: number; model: string; error?: string }> {
  const start = performance.now();
  try {
    const text = await callGroqChat(
      [
        { role: 'system', content: 'You are a test ping responder. Reply ONLY with: OK' },
        { role: 'user', content: 'Ping' },
      ],
      { max_tokens: 10, temperature: 0 }
    );
    const latency = Math.round(performance.now() - start);
    return { ok: text.includes('OK') || text.length > 0, latencyMs: latency, model: getGroqModel() };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    return { ok: false, latencyMs: latency, model: getGroqModel(), error: err.message || String(err) };
  }
}

const KISUMU_SYSTEM_CONTEXT = `
You are the decision-support assistant for a mental health referral and linkage pilot run by the Kisumu County Department of Health, Kenya, in the informal settlements of Obunga, Nyalenda A and B, Manyatta A and B, Manyatta Arabs, Kaloleni, Kondele and Bandani.
Rules you must follow:
1. You support health workers. You never diagnose, prescribe or decide a referral. Screening results are not diagnoses; say "screened positive", never "has depression".
2. You never handle emergencies. If anything suggests suicidal intent, psychosis, risk of harm or a medical emergency, tell the user to stop and escalate to the on-call clinician by phone now, then say nothing more about it.
3. You only see pseudonymous IDs and aggregated or de-identified data. Never ask for names, phone numbers or other identifiers.
4. Follow Kenya's National Clinical Guidelines for Management of Common Mental Disorders (2024), WHO mhGAP and the county referral protocol. If you are unsure what a guideline says, say so rather than guessing.
5. Use only the facts you are given. Do not invent results, history or services.
6. Write plainly and briefly, with short headings and bullet points.
`;

export async function askHealthCopilot(
  userQuery: string,
  currentContext: {
    activeTab: string;
    details?: string;
  },
  history: ChatMessage[] = []
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: `${KISUMU_SYSTEM_CONTEXT}\nCurrent User View: ${currentContext.activeTab}\nView Context: ${currentContext.details || 'Kisumu County Health Operations Dashboard'}` },
    ...history.slice(-6),
    { role: 'user', content: userQuery },
  ];

  return callGroqChat(messages, { temperature: 0.3, max_tokens: 1000 });
}

export interface ReferralBriefInput {
  referralId: string;
  client: string;
  ageBand: string;
  sex: string;
  settlement: string;
  urgency: string;
  service: string;
  destination: string;
  scores: string[];
  concerns: string[];
  context: string[];
  status: string;
}

/** Drafts a structured referral note for the receiving clinician from de-identified fields. */
export async function generateReferralNote(r: ReferralBriefInput): Promise<string> {
  const prompt = `Draft a referral note for the receiving clinician. Use only these de-identified fields:
- Referral: ${r.referralId}, client ${r.client}, ${r.sex}, age ${r.ageBand}, ${r.settlement}
- Urgency: ${r.urgency}. Service requested: ${r.service} at ${r.destination}
- Screening results: ${r.scores.join('; ') || 'none recorded'}
- Concerns reported to the CHP: ${r.concerns.join(', ') || 'none recorded'}
- Context: ${r.context.join(', ') || 'none recorded'}
- Current status: ${r.status}

Structure the note as:
1. **Reason for referral**: two sentences, stating screening results as screening results, not diagnoses.
2. **Points to assess**: what the clinician may want to explore, in line with mhGAP, including co-occurring risks.
3. **Information the referrer needs back**: what feedback would help the CHP support follow-up at home.
End with: "AI-drafted from screening data. To be checked and edited by the referring health worker before sending."`;

  return callGroqChat(
    [
      { role: 'system', content: KISUMU_SYSTEM_CONTEXT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2, max_tokens: 700 }
  );
}

/** Summarises aggregated pathway figures for the county mental health coordinator. */
export async function generateLinkageBrief(figures: string[]): Promise<string> {
  const prompt = `Write a short weekly brief for the county mental health coordinator about the referral and linkage pathway. Use only these aggregated figures:
${figures.map((f) => `- ${f}`).join('\n')}

Structure it as:
1. **Where the pathway is losing people**: the two or three biggest drop-off points, with the numbers.
2. **Settlements or facilities to follow up**: which ones, and why.
3. **Suggested actions for this week**: practical steps for facility focal persons and CHP supervisors.
Keep it under 200 words. Do not speculate beyond the figures.`;

  return callGroqChat(
    [
      { role: 'system', content: KISUMU_SYSTEM_CONTEXT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2, max_tokens: 600 }
  );
}
