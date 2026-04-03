import { Router } from "express";
import { scrapeLinkedInPost } from "../services/playwright.js";

const router = Router()

router.post('/', async (req, res) => {
    const { url } = req.body

    if (!url || !url.includes('linkedin.com/posts')) {
        return res.status(400).json({ error: 'Please provide a valid Linkedin post URL'})
    }

    try {
        const result = await scrapeLinkedInPost(url)

        if (!result.success) {
            return res.status(500).json({ error: result.error })
        }
        return res.json(result)
    } catch (err){
        return res.status(500).json({ error: err.message })
    }
})

export default router