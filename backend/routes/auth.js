import { Router } from 'express'
import { getAccessToken, getProfile, getOrganizations } from '../services/linkedin.js'

const router = Router()

const SCOPES = ['openid', 'profile', 'w_member_social', 'r_organization_social', 'rw_organization_admin', 'w_organization_social',].join(' ')

router.get('/linkedin', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: SCOPES,
    state: 'random_state_string',
  })
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`)
})

router.get('/linkedin/callback', async (req, res) => {
  const { code, error } = req.query

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`)
  }

  try {
    const tokenData = await getAccessToken(code)
    const profile = await getProfile(tokenData.access_token)

    const rawId = profile.sub || ''
    const userId = rawId.includes('urn:li:person:')
      ? rawId.replace('urn:li:person:', '')
      : rawId

    req.session.user = {
      id: userId,
      name: profile.name,
      picture: profile.picture,
      accessToken: tokenData.access_token,
    }

    // Save session explicitly before redirect
    req.session.save((err) => {
      if (err) console.error('Session save error:', err)

      // Pass user info in URL as fallback
      const params = new URLSearchParams({
        auth: 'success',
        userId,
        name: profile.name,
        picture: profile.picture || '',
        token: tokenData.access_token,
      })

      res.redirect(`${process.env.FRONTEND_URL}?${params}`)
    })
  } catch (err) {
    console.error('Auth error:', err.message)
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`)
  }
})


router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(200).json({ user: null })
  }
  const { id, name, picture } = req.session.user
  res.json({ id, name, picture })
})

router.post('/logout', (req, res) => {
  req.session.destroy()
  res.json({ success: true })
})

router.get('/organizations', async (req, res) => {
  const { accessToken } = req.query

  if (!accessToken) {
    return res.status(400).json({ error: "accessToken is required" })
  }

  try {
    const result = await getOrganizations(accessToken)
    res.json(result);
  } catch (err) {
    console.error('Error fething LinkedIn organizations', err)
    res.status(500).json({ error: err.message });
  }
});

export default router