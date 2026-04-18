import axios from 'axios'

export async function buildImagePrompt(postContent) {
    const truncated = postContent.slice(0, 300)
    return `Professional LinkedIn post illustration for: ${truncated}. Clean modern corporate style.Use the already existing image as reference`
}

async function generateWithFal(prompt) {
    console.log('Trying fal.ai...');
    try {
        // Step 1: POST to generate (returns image URL)
        const genResponse = await axios.post('https://fal.run/fal-ai/flux/schnell',
            {
                prompt,
                image_size: 'landscape_16_9',  // ~1200x675, LinkedIn-friendly
                num_inference_steps: 4,
                seed: Date.now(),  // Random each time
                output_format: 'png',
                safety_classifier: 'none'  // Skip filters if needed
            },
            {
                headers: {
                    'Authorization': `Key ${process.env.FAL_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 45000,  // 45s max
            }
        );

        const imageUrl = genResponse.data.images?.[0] || genResponse.data.image_url;
        if (!imageUrl) throw new Error('No image URL returned');

        // Step 2: Fetch image buffer (public URL)
        const imgResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
        });

        const buffer = Buffer.from(imgResponse.data);
        if (buffer.length < 1000) throw new Error('Image too small');

        const base64 = buffer.toString('base64');
        console.log('fal.ai succeeded:', imageUrl);

        return {
            type: 'buffer',
            buffer,
            base64,
            mimeType: 'image/png',
            url: imageUrl,
            previewUrl: `data:image/png;base64,${base64}`,
        };
    } catch (err) {
        console.error('fal.ai failed:', err.response?.data || err.message);
        throw new Error(`fal.ai failed: ${err.message}`);
    }
}

async function generateWithPollinations(prompt) {
    console.log("Trying Pollinations fallback...")
    const encoded = encodeURIComponent(prompt.slice(0, 200))
    const seed = Date.now()
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true&model=flux`;
            const response = await axios.get(pollinationsUrl, {
                responseType: 'arraybuffer',
                timeout: 30000 + (attempt * 10000),  // Progressive timeout
            });

            const buffer = Buffer.from(response.data);
            const base64 = buffer.toString('base64');
            console.log('Pollinations succeeded');
            return {
                type: 'buffer', buffer, base64,
                mimeType: 'image/jpeg',
                url: pollinationsUrl,
                previewUrl: `data:image/jpeg;base64,${base64}`,
            };
        } catch (err) {
            console.log(`Pollinations attempt ${attempt + 1} failed:`, err.message);
            if (attempt < maxRetries - 1) {
                await new Promise(r => setTimeout(r, 3000));
            }
        }
    }
    throw new Error('Pollinations all retries failed');
}

async function generateWithFreeFallback(prompt) {
    console.log('Trying free fallbacks...');

    // 1. Craiyon API (most reliable free)
    try {
        const encoded = encodeURIComponent(prompt.slice(0, 150));
        const craiyonUrl = `https://api.craiyon.com/v3?prompt=${encoded}`;
        const res = await axios.post(craiyonUrl, {}, {
            responseType: 'arraybuffer',
            timeout: 45000,
            headers: { 'Content-Type': 'application/json' }
        });

        const buffer = Buffer.from(res.data);
        if (buffer.length > 1000) {
            const base64 = buffer.toString('base64');
            return {
                type: 'buffer', buffer, base64,
                mimeType: 'image/png',
                url: null,
                previewUrl: `data:image/png;base64,${base64}`,
            };
        }
    } catch (e) {
        console.log('Craiyon failed:', e.message);
    }

    throw new Error('All free fallbacks failed');
}

export async function generateImage(prompt) {
    try {
        return await generateWithFal(prompt);
    } catch (falErr) {
        console.error('Fal.ai failed:', falErr.message);

        try {
            return await generateWithPollinations(prompt);
        } catch (pollErr) {
            console.error('Pollinations failed:', pollErr.message);

            try {
                return await generateWithFreeFallback(prompt);
            } catch (freeErr) {
                console.error('All generators failed:', freeErr.message);
                return null;
            }
        }
    }
}



//for backward compatibility
// export function generateImageUrl(prompt) {
//     const encoded = encodeURIComponent(prompt.slice(0, 200))
//     return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&nologo=true`
// }