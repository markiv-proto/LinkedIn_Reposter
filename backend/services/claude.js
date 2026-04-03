import Groq from 'groq-sdk'

export async function rewritePost({ content, tone, length }) {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const lengthGuide = {
    short: 'under 100 words',
    medium: '100–200 words',
    long: '200–350 words',
  }

  const toneGuide = {
    professional: 'formal, authoritative and professional',
    casual: 'conversational, warm and approachable',
    inspirational: 'motivating, energetic and uplifting',
    educational: 'clear, informative and structured with key takeaways',
  }

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'You are a LinkedIn content expert. Rewrite posts to maximise engagement. Output only the post text — no preamble, no markdown formatting, no explanations.',
      },
      {
        role: 'user',
        content: `Rewrite this LinkedIn post.

Tone: ${toneGuide[tone] || toneGuide.professional}
Length: ${lengthGuide[length] || lengthGuide.medium}

Rules:
- Keep the core message and any key facts
- Preserve or add relevant hashtags
- Output only the rewritten post, nothing else

Original post:
${content}`,
      },
    ],
  })

  return response.choices[0].message.content.trim()
}