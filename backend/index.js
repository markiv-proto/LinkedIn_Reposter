import express from 'express'
import cors from 'cors'
import session from 'express-session'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import scrapeRouter from './routes/scrape.js'
import regenRouter from './routes/regen.js'
import authRouter from './routes/auth.js'
import publishRouter from './routes/publish.js'
import { startScheduler } from './jobs/scheduler.js'

dotenv.config()

const app = express()
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
     },
}))

app.use('/api/scrape', scrapeRouter)
app.use('/api/regen', regenRouter)
app.use('/api/auth', authRouter)
app.use('/api/publish', publishRouter)


app.get('/health', (req, res) => res.json({ status: 'ok' }))

mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('MongoDB connected')
    startScheduler()
    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}).catch((err) => console.error('MongoDB connection error:', err))