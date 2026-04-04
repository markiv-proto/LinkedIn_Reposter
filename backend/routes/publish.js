import { Router } from "express";
import { publishPost } from "../services/linkedin.js";
import ScheduledPost from '../models/ScheduledPost.js'

const router = Router()

// const requireAuth = (req, res, next) => {
//     if (!req.session.user) {
//         return res.status(401).json({ error: 'Not Authenticated.Please connect LinkedIn first.' })
//     }
//     next()
// }
router.post('/now', async (req, res) => {
  const { content, imageUrl, userId, accessToken } = req.body

  if (!userId || !accessToken) {
    return res.status(401).json({ error: 'Not authenticated. Please connect LinkedIn first.' })
  }
  if (!content) return res.status(400).json({ error: 'Content is required' })

  try {
    const result = await publishPost({ accessToken, userId, content, imageUrl })
    res.json({ success: true, postId: result.id })
  } catch (err) {
    console.error('Publish error: ', err.response?.data || err.message)
    res.status(500).json({ error: err.response?.data?.message || err.message })
  }
})

router.post('/schedule', async (req, res) => {
  const { content, imageUrl, scheduledAt, userId, accessToken } = req.body

  console.log('Scheduling for:', scheduledAt, '→ parsed:', new Date(scheduledAt))

  if (!userId || !accessToken) {
    return res.status(401).json({ error: 'Not authenticated. Please connect LinkedIn first.' })
  }
  if (!content || !scheduledAt) {
    return res.status(400).json({ error: 'Content and scheduledAt are required' })
  }
  if (new Date(scheduledAt) <= new Date()) {
    return res.status(400).json({ error: 'Scheduled time must be in the future' })
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

router.get('/scheduled', async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(401).json({ error: 'userId required' })
  try {
    const posts = await ScheduledPost.find({ userId }).sort({ scheduledAt: 1 })
    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


router.delete('/scheduled/:id', async (req, res) => {
    try {
        await ScheduledPost.findByIdAndDelete(req.params.id)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router