// AI service for the Kisumu mental health referral and linkage tool.
//
// The browser never holds an API key. Every request goes to our own server
// function at /api/chat, which adds the key from the server environment.

export const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (recommended)' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (faster)' },
];

// Older versions of the app could save a key in the browser. Remove it.
try {
  localStorage.removeItem('kisumu_groq_api_key');
} catch {
  // Storage may be unavailable; nothing to clean up.
}

export function getGroqModel(): string {
  try {
    const saved = localStorage.getItem('kisumu_groq_model');
    if (saved && AVAILABLE_MODELS.some((m) => m.id === saved)) return saved;
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_MODEL;
}

export function setGroqModel(model: string): void {
  try {
    localStorage.setItem('kisumu_groq_model', model);
  } catch {
    // The choice just won't be remembered.
  }
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
  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: options?.model || getGroqModel(),
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.max_tokens ?? 1000,
      }),
    });
  } catch {
    throw new Error('Could not reach the server. Check your internet connection.');
  }

  let data: { content?: string; error?: string } = {};
  try {
    data = await response.json();
  } catch {
    // Non-JSON reply, handled below.
  }
  if (!response.ok || !data.content) {
    throw new Error(data.error || `The AI request failed (${response.status}).`);
  }
  return data.content;
}

export async function testGroqConnection(): Promise<{ ok: boolean; latencyMs: number; model: string; error?: string }> {
  const start = performance.now();
  try {
    await callGroqChat(
      [
        { role: 'system', content: 'Reply only with: OK' },
        { role: 'user', content: 'Ping' },
      ],
      { max_tokens: 10, temperature: 0 }
    );
    return { ok: true, latencyMs: Math.round(performance.now() - start), model: getGroqModel() };
  } catch (err: unknown) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      model: getGroqModel(),
      error: err instanceof Error ? err.message : String(err),
    };
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
