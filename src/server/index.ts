import express from 'express'
import cors from 'cors'
import { transcribeRouter } from './routes/transcribe'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api', transcribeRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
