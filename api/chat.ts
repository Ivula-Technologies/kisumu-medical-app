// Server-side proxy to Groq. The API key lives only in the server environment
// (GROQ_API_KEY) and is never sent to the browser.
//
// On Vercel this runs as a serverless function. In local development the Vite
// dev server calls the same handler (see vite.config.ts).

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
// Original project key, kept by the owner's decision. A GROQ_API_KEY set in the
// server environment takes priority. This key stays on the server and is never
// sent to the browser.
const FALLBACK_GROQ_KEY = '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'
const ALLOWED_MODELS = new Set(['openai/gpt-oss-120b', 'openai/gpt-oss-20b'])
const DEFAULT_MODEL = 'openai/gpt-oss-120b'
const MAX_MESSAGES = 16
const MAX_MESSAGE_CHARS = 6000
const MAX_TOTAL_CHARS = 24000
const MAX_TOKENS = 1200

// Best-effort limit per client address. Serverless instances do not share
// memory, so this slows abuse rather than stopping it outright.
const WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 40
const recent = new Map<string, number[]>()

function rateLimited(client: string, now: number): boolean {
  const times = (recent.get(client) ?? []).filter((t) => now - t < WINDOW_MS)
  times.push(now)
  recent.set(client, times)
  if (recent.size > 5000) recent.clear()
  return times.length > MAX_REQUESTS_PER_WINDOW
}

function header(req: any, name: string): string {
  const value = req.headers?.[name]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

/** Browsers send Origin on cross-site requests. Only accept our own site. */
function sameOrigin(req: any): boolean {
  const origin = header(req, 'origin')
  if (!origin) return true
  try {
    return new URL(origin).host === header(req, 'host')
  } catch {
    return false
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function validMessages(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return false
  let total = 0
  for (const m of value) {
    if (!m || typeof m !== 'object') return false
    const { role, content } = m as Record<string, unknown>
    if (role !== 'system' && role !== 'user' && role !== 'assistant') return false
    if (typeof content !== 'string' || content.length > MAX_MESSAGE_CHARS) return false
    total += content.length
  }
  return total <= MAX_TOTAL_CHARS
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Use POST.' })
  }
  if (!sameOrigin(req)) {
    return res.status(403).json({ error: 'Requests from other websites are not allowed.' })
  }

  const client = header(req, 'x-forwarded-for').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
  if (rateLimited(client, Date.now())) {
    return res.status(429).json({ error: 'Too many AI requests. Wait a few minutes and try again.' })
  }

  const apiKey = process.env.GROQ_API_KEY || FALLBACK_GROQ_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'The AI assistant is not set up on this server yet.' })
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body ?? {}
  const { messages, model, temperature, max_tokens } = body as Record<string, unknown>
  if (!validMessages(messages)) {
    return res.status(400).json({ error: 'The request was too long or badly formed.' })
  }

  const chosenModel = typeof model === 'string' && ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL
  const temp = typeof temperature === 'number' ? Math.min(Math.max(temperature, 0), 1) : 0.2
  const tokens = typeof max_tokens === 'number' ? Math.min(Math.max(Math.round(max_tokens), 1), MAX_TOKENS) : 800

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: chosenModel, messages, temperature: temp, max_tokens: tokens }),
    })

    if (!response.ok) {
      // Log the detail on the server; send the browser a plain message.
      console.error('Groq error', response.status, (await response.text()).slice(0, 500))
      const message =
        response.status === 401 || response.status === 403
          ? 'The AI service rejected the server key. It may have been revoked or replaced.'
          : response.status === 429
            ? 'The AI service is busy or the free quota is used up. Try again later.'
            : 'The AI service returned an error. Try again later.'
      return res.status(502).json({ error: message })
    }

    const data: any = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content) {
      return res.status(502).json({ error: 'The AI service returned an empty answer.' })
    }
    return res.status(200).json({ content, model: chosenModel })
  } catch (error) {
    console.error('Groq request failed', error)
    return res.status(502).json({ error: 'Could not reach the AI service.' })
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
