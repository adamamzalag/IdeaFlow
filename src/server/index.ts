import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { transcribeRouter } from './routes/transcribe'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api', transcribeRouter)

// Serve static files from the built frontend
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

// SPA fallback - serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
