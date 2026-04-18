import { Router } from 'express'
import axios from 'axios'
import { generateImage, buildImagePrompt } from '../services/imageGen.js'

const router = Router()

router.post('/generate', async (req, res) => {
  const { prompt, postContent } = req.body
  if (!prompt && !postContent) return res.status(400).json({ error: 'prompt or postContent required' })
  try {
    const finalPrompt = prompt || await buildImagePrompt(postContent)
    console.log('Generating image for prompt:', finalPrompt.slice(0, 80))
    const result = await generateImage(finalPrompt)
    console.log('Result:', result ? 'got image' : 'null')
    if (!result) return res.status(500).json({ error: 'All generators failed' })
    res.json({
      url: result.url,
      previewUrl: result.previewUrl,
      base64: result.base64,
      mimeType: result.mimeType,
    })
  } catch (err) {
    console.error('Route error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.get('/search/unsplash', async (req, res) => {
  const { query, page = 1, per_page = 12 } = req.query
  if (!query) return res.status(400).json({ error: 'query required' })
  try {
    const { data } = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, page, per_page, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    })
    res.json(data.results.map(p => ({
      id: p.id,
      thumb: p.urls.small,
      full: p.urls.regular,
      alt: p.alt_description,
      credit: p.user.name,
      creditUrl: p.user.links.html,
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/search/pexels', async (req, res) => {
  const { query, page = 1, per_page = 12 } = req.query
  if (!query) return res.status(400).json({ error: 'query required' })
  try {
    const { data } = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, page, per_page, orientation: 'landscape' },
      headers: { Authorization: process.env.PEXELS_API_KEY },
    })
    res.json(data.photos.map(p => ({
      id: p.id,
      thumb: p.src.medium,
      full: p.src.large2x,
      alt: p.alt,
      credit: p.photographer,
      creditUrl: p.photographer_url,
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router