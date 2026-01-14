import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { transcribeRouter } from './routes/transcribe'
import { ideasRouter } from './routes/ideas'
import { chatRouter } from './routes/chat'
import { ensureDefaultUser } from './utils/ensureDefaultUser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api', transcribeRouter)
app.use('/api', ideasRouter)
app.use('/api', chatRouter)

// Serve static files from the built frontend
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

// SPA fallback - serve index.html for all non-API routes
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

async function start() {
  try {
    await ensureDefaultUser()
    console.log('Default user initialized')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()

export default app
