import axios from 'axios'
import * as cheerio from 'cheerio'

export async function scrapeLinkedInPost(url) {
  try {
    // Use a CORS proxy to bypass LinkedIn's bot detection
    const encodedUrl = encodeURIComponent(url)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodedUrl}`

    const res = await axios.get(proxyUrl, { timeout: 15000 })
    const html = res.data.contents

    if (!html) throw new Error('No content returned from proxy')

    const $ = cheerio.load(html)

    const getMeta = (prop) =>
      $(`meta[property="${prop}"]`).attr('content') ||
      $(`meta[name="${prop}"]`).attr('content') ||
      null

    const content = getMeta('og:description') || ''
    const imageUrl = getMeta('og:image') || null
    const title = getMeta('og:title') || ''

    // Extract links
    const links = []
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (
        href &&
        href.startsWith('http') &&
        !href.includes('linkedin.com/in/') &&
        !href.includes('linkedin.com/company/')
      ) {
        links.push(href)
      }
    })

    const uniqueLinks = [...new Set(links)]

    // If og:description is empty, try to extract from JSON-LD
    let finalContent = content
    if (!finalContent) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html())
          if (json.description) finalContent = json.description
          if (json.articleBody) finalContent = json.articleBody
        } catch { /* skip */ }
      })
    }

    if (!finalContent && !imageUrl) {
      throw new Error('LinkedIn returned no content. The post may be private or LinkedIn blocked the request.')
    }

    return {
      success: true,
      content: finalContent,
      imageUrl,
      title,
      links: uniqueLinks,
      url,
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}