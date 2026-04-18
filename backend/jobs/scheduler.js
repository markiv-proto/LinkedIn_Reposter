import cron from 'node-cron'
import ScheduledPost from '../models/ScheduledPost.js'
import { publishPost } from '../services/linkedin.js'

export function startScheduler() {
    cron.schedule('* * * * *', async () => {
        const now = new Date()
        const pending = await ScheduledPost.find({
            status: "pending",
            scheduledAt: { $lte: now },
        })

        for (const post of pending) {
            try {
                const result = await publishPost({
                    accessToken: post.accessToken,
                    userId: post.userId,
                    content: post.content,
                    imageUrl: post.imageUrl,
                    imageBase64: post.imageBase64 || null,
                    imageMimeType: post.imageMimeType || null,
                    organizationId: post.organizationId || null,
                })
                post.status = 'published'
                post.linkedInPostId = result.id
                await post.save()
                console.log(`Published scheduled post ${post._id}`)
            } catch (err) {
                post.status = 'failed'
                post.errorMessage = err.message
                await post.save()
                console.error(`Failed scheduled post ${post._id}:`, err.message)
            }
        }
    })
    console.log('Scheduler started - checking every minute')
}