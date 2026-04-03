import { Router } from "express";
import { publishPost } from "../services/linkedin.js";
import ScheduledPost from '../models/ScheduledPost.js'

const router = Router()

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not Authenticated.Please connect LinkedIn first.' })
    }
    next()
}

router.post('/now', requireAuth, async (req, res) => {
    const { content, imageUrl } = req.body
    const { id: userId, accessToken } = req.session.user

    console.log('Publish request — userId:', userId, '| hasToken:', !!accessToken)

    if (!content) return res.status(400).json({ error: 'Content is required' })

    try {
        const result = await publishPost({ accessToken, userId, content, imageUrl })

        // res.json({ success: true, postId: result.id })

        const rawId = result.id || ''
        // const postId = rawId.startsWith('urn:li:share:')
        // ? rawId.replace('urn:li:share:','') : rawId 
        
        const postId = rawId.startsWith('urn:li:activity:')
        ? rawId.replace('urn:li:activity:', '')
        : rawId
        
        console.log('postID: ', postId)
        res.json({ success: true, postId })
    } catch (err) {
        console.error('Publish error: ', err.response?.data?.message || err.message)
        res.status(500).json({ error: err.response?.data?.message || err.message })
    }
})

router.post("/schedule", requireAuth, async (req, res) => {
    const { content, imageUrl, scheduledAt } = req.body
    const { id: userId, accessToken } = req.session.user

    if (!content || !scheduledAt) {
        return res.status(400).json({ error: 'Content and scheduledAt are required' })
    }

    if (new Date(scheduledAt) <= new Date()) {
        return res.status(400).json({ error: "Scheduled time must be in the future." })
    }

    try {
        const post = await ScheduledPost.create({
            userId,
            accessToken,
            content,
            imageUrl,
            scheduledAt: new Date(scheduledAt),
        })
        res.json({ success: true, jobId: post._id, scheduledAt: post.scheduledAt })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})


router.get('/scheduled', requireAuth, async (req, res) => {
    const { id: userId } = req.session.user
    try {
        const posts = await ScheduledPost.find({ userId }).sort({ scheduledAt: 1 })
        res.json(posts)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})


router.delete('/scheduled/:id', requireAuth, async (req, res) => {
    try {
        await ScheduledPost.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router