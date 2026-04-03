import { chromium } from 'playwright'

export async function scrapeLinkedInPost(url) {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    const page = await context.newPage()

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await page.waitForTimeout(2500)

        const data = await page.evaluate(() => {
            const getMeta = (prop) => {
                const el = document.querySelector(`meta[property="${prop}"]`) ||
                    document.querySelector(`meta[name="${prop}"]`)
                return el ? el.getAttribute('content') : null
            }

            // Extract post text from og:description or visible text
            const content =
                getMeta('og:description') ||
                document.querySelector('.attributed-text-segment-list__content')
                    ?.innerText ||
                ''

            // Extract image
            const imageUrl = getMeta('og:image') || null

            // Extract title / author
            const title = getMeta('og:title') || ''

            // Extract all hyperlinks in the post body
            const linkEls = document.querySelectorAll('a[href]')
            const links = [...linkEls].map((a) => a.href).filter((h) =>
                h.startsWith('http') &&
                !h.includes('linkedin.com/in/') &&
                !h.includes('linkedin.com/company/')
            )
            const uniqueLinks = [...new Set(links)]

            return { content, imageUrl, title, links: uniqueLinks }
        })
        return { success: true, ...data, url }
    }
    catch (err) {
        return { success: false, error: err.message }
    } finally {
        await browser.close()
    }
}