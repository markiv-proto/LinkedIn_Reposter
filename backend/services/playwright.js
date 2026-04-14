import axios from 'axios'
import * as cheerio from 'cheerio'

async function fetchWithProxy(url) {
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://thingproxy.freeboard.io/fetch/${url}`,
  ]

  for (const proxy of proxies) {
    try {
      const res = await axios.get(proxy, { timeout: 12000 })
      const html = proxy.includes('allorigins')
        ? res.data.contents
        : res.data

      if (html && html.length > 500) {
        console.log('Proxy worked:', proxy)
        return html
      }
    } catch (err) {
      console.log('Proxy failed:', proxy, err.message)
    }
  }

  throw new Error('All proxies failed or timed out')
}

export async function scrapeLinkedInPost(url) {
  try {
    console.log("Scraping content...")
    const html = await fetchWithProxy(url)
    const $ = cheerio.load(html)

    const getMeta = (prop) =>
      $(`meta[property="${prop}"]`).attr('content') ||
      $(`meta[name="${prop}"]`).attr('content') ||
      null

    const content = getMeta('og:description') || ''
    const imageUrl = getMeta('og:image') || null
    const title = getMeta('og:title') || ''

    // Try JSON-LD if og:description is empty
    let finalContent = content
    if (!finalContent) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html())
          if (json.description) finalContent = json.description
          if (json.articleBody) finalContent = json.articleBody
        } catch { }
      })
    }

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

    return {
      success: true,
      content: finalContent,
      imageUrl,
      title,
      links: [...new Set(links)],
      url,
      warning: !finalContent
        ? 'Could not extract post content. Please paste it manually below.'
        : null,
    }
  } catch (err) {
    console.error('Scrape error:', err.message)
    // Don't return 500 — return empty shell so user can paste manually
    return {
      success: true,
      content: '',
      imageUrl: null,
      title: 'LinkedIn Post',
      links: [url],
      url,
      warning: 'Could not extract post content automatically. Please paste it manually below.',
    }
  }
}