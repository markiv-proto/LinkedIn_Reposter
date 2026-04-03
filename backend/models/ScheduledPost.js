import mongoose from "mongoose";

const scheduledPostSchema = new mongoose.Schema({
userId: { type: String, required: true },
accessToken: { type: String, required: true },
content: { type: String, required: true }, 
imageUrl: { type: String, default: null }, 
scheduledAt: { type: Date, required: true }, 
status: { type: String, enum: ['pending', 'published', 'failed'], default: 'pending' },

linkedInPostId: { type: String, default: null }, 
errorMessage: { type: String, default: null }, 
createdAt: { type: String, default: Date.now }, 
})

export default mongoose.model('ScheduledPost', scheduledPostSchema)