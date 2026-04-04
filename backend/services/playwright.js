import axios from 'axios'
import * as cheerio from 'cheerio'

export async function scrapeLinkedInPost(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    })

    const $ = cheerio.load(res.data)

    const getMeta = (prop) =>
      $(`meta[property="${prop}"]`).attr('content') ||
      $(`meta[name="${prop}"]`).attr('content') ||
      null

    const content = getMeta('og:description') || ''
    const imageUrl = getMeta('og:image') || null
    const title = getMeta('og:title') || ''

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

    return { success: true, content, imageUrl, title, links: uniqueLinks, url }
  } catch (err) {
    return { success: false, error: err.message }
  }
}