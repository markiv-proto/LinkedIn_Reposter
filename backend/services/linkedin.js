import axios from 'axios'

export async function getAccessToken(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
  })

  const res = await axios.post(
    'https://www.linkedin.com/oauth/v2/accessToken',
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  return res.data
}

export async function getProfile(accessToken) {
  const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.data
}

export async function publishPost({ accessToken, userId, content, imageUrl, imageBase64, imageMimeType, organizationId }) {
  console.log('Publishing with userId:', userId, '| orgId: ', organizationId || "none")

  const authorUrn = organizationId
    ? `urn:li:organization:${organizationId}`
    : `urn:li:person:${userId}`

  console.log('Author URN: ', authorUrn)

  let assetUrn = null

  try {
    if (imageBase64 && imageMimeType) {
      console.log('Uploading image from base64 buffer...')
      assetUrn = await uploadBase64ImageToLinkedIn(
        accessToken,
        authorUrn,
        imageBase64,
        imageMimeType
      )
    } else if (imageUrl && !imageUrl.startsWith('data:')) {
      // Pollinations path — fetch URL then upload
      console.log('Fetching image from URL for upload:', imageUrl)
      const imgRes = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const buffer = Buffer.from(imgRes.data)
      const mimeType = imgRes.headers['content-type']?.split(';')[0] || 'image/jpeg'
      console.log('Image fetched — size:', buffer.length, 'type:', mimeType)
      assetUrn = await uploadBase64ImageToLinkedIn(
        accessToken,
        authorUrn,
        buffer.toString('base64'),
        mimeType
      )
    }
  } catch (err) {
    console.error('Image upload failed, posting without image:', err.message)
    assetUrn = null
  }

  const postBody = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: assetUrn ? 'IMAGE' : 'NONE',
        ...(assetUrn && {
          media: [
            {
              status: 'READY',
              media: assetUrn,
              description: { text: 'Post image' },
              title: { text: 'Image' },
            }
          ]
        })
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  const res = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    postBody,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  )
  return res.data
}

export async function getOrganizations(accessToken) {
  try {
    // Use roleAssignee to find orgs where user is admin
    const res = await axios.get(
      'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=10',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401',
        },
      }
    )

    const elements = res.data.elements || []
    if (elements.length === 0) return []

    // Fetch name for each org
    const orgs = await Promise.all(
      elements.map(async (el) => {
        try {
          const orgUrn = el.organization || el.organizationalTarget
          const orgId = orgUrn.split(':').pop()

          const orgRes = await axios.get(
            `https://api.linkedin.com/v2/organizations/${orgId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202401',
              },
            }
          )

          const name =
            orgRes.data.localizedName ||
            Object.values(orgRes.data.name?.localized || {})[0] ||
            'Company Page'

          let logo = null
          try {
            const logoUrn = orgRes.data.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier
            if (logoUrn) logo = logoUrn
          } catch {
            logo = null
          }

          return { id: orgId, name, logo }
        } catch (err) {
          console.error('Failed to fetch org details:', err.response?.data || err.message)
          return null
        }
      })
    )

    return orgs.filter(Boolean)
  } catch (err) {
    console.error(
      'Error fetching LinkedIn organizations:',
      err.response?.data || err.message
    )
    return []
  }
}

export async function uploadBase64ImageToLinkedIn(accessToken, authorUrn, base64, mimeType) {
  try {
    // Step 1 - register upload
    const registerRes = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    const uploadUrl = registerRes.data.value.uploadMechanism[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ].uploadUrl

    const assetUrn = registerRes.data.value.asset

    // Step 2 - upload buffer
    const imageBuffer = Buffer.from(base64, 'base64')
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })

    console.log('Image uploaded to LinkedIn - asset URN:', assetUrn)
    return assetUrn
  } catch (err) {
    console.error('LinkedIn image upload failed:', err.response?.data || err.message)
    return null
  }
}