import { Router } from 'express'
import { rewritePost } from '../services/claude.js'
import { generateImageUrl, buildImagePrompt } from '../services/pollinations.js'

const router = Router()

router.post('/', async (req, res) => {
    const { content, tone = 'professional', length = 'medium', regenerateImage = true } = req.body


    console.log('--- REGEN REQUEST ---')
    console.log('content length:', content?.length)
    console.log('tone:', tone)
    console.log('length:', length)
    console.log('API KEY exists:', !!process.env.GROQ_API_KEY)

    if (!content) {
        return res.status(400).json({ error: 'Content is required' })
    }

    try {
        const [rewrittenContent, imagePrompt] = await Promise.all([
            rewritePost({ content, tone, length }),
            regenerateImage ? buildImagePrompt(content) : Promise.resolve(null),
        ])

        const imageUrl = imagePrompt ? generateImageUrl(imagePrompt) : null

        return res.json({
            content: rewrittenContent,
            imageUrl,
            tone,
            length,
        })
    } catch (err) {
        console.error('Regen error: ', err)
        return res.status(500).json({ error: err.message })
    }
})

export default router