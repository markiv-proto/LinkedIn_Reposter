import axios from 'axios'

export async function buildImagePrompt(postContent) {
  const truncated = postContent.slice(0, 300)
  return `Professional LinkedIn post illustration for: ${truncated}. Clean modern corporate style. Use the already existing image as reference`
}

async function generateWithPollinations(prompt) {
  console.log("Generating with Pollinations...")
  const encoded = encodeURIComponent(prompt.slice(0, 200))
  const seed = Date.now()
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true&model=flux`

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    const buffer = Buffer.from(response.data)
    if (buffer.length < 1000) throw new Error('Image too small')

    const base64 = buffer.toString('base64')
    console.log('Pollinations succeeded, size:', buffer.length)

    return {
      type: 'buffer',
      buffer,
      base64,
      mimeType: 'image/jpeg',
      url,
      previewUrl: `data:image/jpeg;base64,${base64}`,
    }
  } catch { }
}


export async function generateImage(prompt) {
  try {
    return await generateWithPollinations(prompt);
  } catch (pollErr) {
    console.error('Pollinations failed:', pollErr.message);
    return null
  }

}



