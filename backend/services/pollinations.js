export function generateImageUrl(prompt) {
    const sanitized = prompt.replace(/[a-zA-Z0-9 ]/g, ' ').trim().slice(0,200)

    const encoded = encodeURIComponent(sanitized)
    return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&nologo=true`
}

export async function buildImagePrompt(postContent) {
    const truncated = postContent.slice(0, 300)
    return `Professional LinkedIn post illustration for: ${truncated}. Clean, modern, corporate style, no text.`
}