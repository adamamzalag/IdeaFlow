import { Router } from 'express'
import multer from 'multer'
import OpenAI from 'openai'

const router = Router()

// Configure multer for audio file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit (Whisper max)
})

// Lazy initialization of OpenAI client (only when API key is available)
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// POST /api/transcribe - Transcribe audio using Whisper
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    const openai = getOpenAIClient()

    // Create a File object from the buffer for OpenAI
    const audioFile = new File([req.file.buffer], req.file.originalname || 'audio.webm', {
      type: req.file.mimetype || 'audio/webm',
    })

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    })

    res.json({ transcript: transcription.text })
  } catch (error) {
    console.error('Transcription error:', error)
    res.status(500).json({
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as transcribeRouter }
