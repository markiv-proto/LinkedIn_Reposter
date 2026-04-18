import { Router } from 'express'
import { rewritePost } from '../services/claude.js'

const router = Router()

router.post('/', async (req, res) => {
  const { content, tone = 'professional', length = 'medium' } = req.body

  console.log('content length:', content?.length)
  console.log('tone:', tone)
  console.log('length:', length)
  console.log('API KEY exists:', !!process.env.GROQ_API_KEY)

  if (!content) {
    return res.status(400).json({ error: 'Content is required' })
  }

  try {
    const [rewrittenContent] = await Promise.all([
      rewritePost({ content, tone, length })
    ])

    return res.json({
      content: rewrittenContent,
      tone,
      length,
    })
  } catch (err) {
    console.error('Regen error: ', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router