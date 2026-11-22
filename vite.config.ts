import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import chatHandler from './api/chat.ts'

/**
 * Serves /api/chat during local development with the same handler Vercel runs,
 * so the AI key stays on the server side locally too. The key is read from
 * GROQ_API_KEY in .env.local, which git ignores. It has no VITE_ prefix, so it
 * is never bundled into the browser code.
 */
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', (req, res) => {
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
          if (raw.length > 100_000) req.destroy()
        })
        req.on('end', () => {
          const request = Object.assign(req, { body: raw })
          const response = Object.assign(res, {
            status(code: number) {
              res.statusCode = code
              return response
            },
            json(payload: unknown) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(payload))
              return response
            },
          })
          void chatHandler(request, response)
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GROQ_API_KEY && !process.env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY
  return { plugins: [react(), devApi()] }
})
