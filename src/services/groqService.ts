// Groq Cloud AI Service for Kisumu Health Intelligence
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
You are the Kisumu Health Intelligence AI Decision-Support Copilot, deployed for the County Department of Health, Kisumu County, Kenya.
Key principles:
1. Support, do not replace, human clinical and epidemiological verification.
2. In accordance with Kenya's Data Protection Act (2019) and Digital Health Act (2023), operate on aggregated non-patient-level data only.
3. Reference Kisumu's 7 sub-counties when relevant: Kisumu Central, Kisumu East, Kisumu West, Seme, Nyakach, Nyando, and Muhoroni.
4. Align clinical recommendations with Kenya Ministry of Health (MOH) guidelines, IDSR (Integrated Disease Surveillance and Response), and KEMSA supply protocols.
5. Provide clear, professional, actionable public health and supply chain insights with bullet points and bold highlights.
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

export async function generateLiveDiseaseAnalysis(params: {
  disease: string;
  subCounty: string;
  currentWeek: string;
  actual: number;
  expectedMin: number;
  expectedMax: number;
  zScore: number;
  whyFlagged: string;
  status: string;
}): Promise<string> {
  const prompt = `Perform an urgent epidemiological decision-support assessment for the following signal in Kisumu County:
- Disease: ${params.disease}
- Sub-County: ${params.subCounty}
- Reporting Period: ${params.currentWeek}
- Actual Reported Cases: ${params.actual}
- Rolling Baseline Expected Range: ${params.expectedMin} - ${params.expectedMax} cases
- Standard Deviation Z-Score: ${params.zScore}
- Flag Reason: ${params.whyFlagged}
- Current Investigation Status: ${params.status}

Please provide:
1. **Epidemiological Risk Evaluation**: Severity assessment and likely transmission drivers in ${params.subCounty} (e.g. seasonal rains, flood-prone lowlands in Nyando/Kadibo, water sources, community gathering).
2. **Immediate Surveillance Actions**: 3-4 specific IDSR steps for the Sub-County Disease Surveillance Coordinator (e.g., active case finding by CHPs, laboratory confirmation swabs/samples, line listing).
3. **Clinical & Case Management Guidance**: Essential supplies needed (e.g. ORS, Zinc, Cholera treatment kits, AL, RDTs) and case triage instructions under Kenya MOH protocols.
4. **Human Action Checklist**: Specific verification checkboxes for the County Health Manager before escalating to County Epidemic Response Committee.`;

  return callGroqChat(
    [
      { role: 'system', content: KISUMU_SYSTEM_CONTEXT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2, max_tokens: 1200 }
  );
}

export async function generateSupplyOptimization(commodity: {
  commodity: string;
  unit: string;
  stockOnHand: number;
  monthlyConsumption: number;
  forecast3Month: number;
  monthsOfStock: number;
  riskStatus: string;
  facilitiesAtRisk: number;
  redistributionSuggestion: string;
}): Promise<string> {
  const prompt = `Perform a supply chain redistribution and stockout mitigation assessment for essential medicines in Kisumu County:
- Commodity: ${commodity.commodity} (${commodity.unit})
- Stock on Hand: ${commodity.stockOnHand.toLocaleString()}
- Average Monthly Consumption: ${commodity.monthlyConsumption.toLocaleString()}
- 3-Month Demand Forecast: ${commodity.forecast3Month.toLocaleString()}
- Current Months of Stock (MOS): ${commodity.monthsOfStock.toFixed(1)} months
- Current Risk Classification: ${commodity.riskStatus}
- Facilities at Immediate Stockout Risk: ${commodity.facilitiesAtRisk}
- Automated Suggestion: ${commodity.redistributionSuggestion}

Provide a structured Decision-Support brief:
1. **Critical Vulnerability Assessment**: Impact on facility service delivery and patient morbidity if stock reaches zero.
2. **Inter-Facility Redistribution Plan**: Specific transfer strategy (from surplus facilities in Kisumu Central/East to deficit rural/sub-county health centres).
3. **KEMSA Emergency Order Recommendation**: Quantity and priority tier for buffer replenishment.
4. **Officer Sign-off Requirement**: Clear disclaimer that this redistribution requires County Pharmacist human authorization.`;

  return callGroqChat(
    [
      { role: 'system', content: KISUMU_SYSTEM_CONTEXT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2, max_tokens: 1000 }
  );
}
