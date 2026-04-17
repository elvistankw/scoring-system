const express = require('express');
const router = express.Router();
const googleService = require('../services/google-service');
const { authenticate } = require('../middleware/auth');
const db = require('../db');

// Temporary flag to disable Google OAuth in production
const GOOGLE_AUTH_ENABLED = process.env.NODE_ENV === 'development';

// Middleware to check if Google Auth is enabled
const checkGoogleAuthEnabled = (req, res, next) => {
  if (!GOOGLE_AUTH_ENABLED) {
    return res.status(503).json({
      status: 'error',
      message: 'Google OAuth is temporarily disabled'
    });
  }
  next();
};

// 获取Google授权URL
router.get('/auth-url', checkGoogleAuthEnabled, authenticate, async (req, res, next) => {
  try {
    const authUrl = googleService.getAuthUrl(req.user.id);
    res.json({
      status: 'success',
      data: { auth_url: authUrl }
    });
  } catch (error) {
    next(error);
  }
});

// 处理Google OAuth回调
router.get('/callback', checkGoogleAuthEnabled, async (req, res, next) => {
  try {
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=授权失败`);
    }

    const tokens = await googleService.handleCallback(code);
    const userInfo = await googleService.getUserInfo(tokens);

    // 保存用户的Google令牌到数据库
    await db.query(
      `INSERT INTO user_google_tokens (user_id, access_token, refresh_token, google_email, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
       access_token = $2, refresh_token = $3, google_email = $4, expires_at = $5, updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        tokens.access_token,
        tokens.refresh_token,
        userInfo.email,
        new Date(tokens.expiry_date)
      ]
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/google-success`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=授权处理失败`);
  }
});

// 检查Google授权状态
router.get('/status', checkGoogleAuthEnabled, authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT google_email, expires_at FROM user_google_tokens WHERE user_id = $1',
      [req.user.id]
    );

    const isAuthorized = result.rows.length > 0 && new Date(result.rows[0].expires_at) > new Date();

    res.json({
      status: 'success',
      data: {
        is_authorized: isAuthorized,
        google_email: result.rows[0]?.google_email || null,
        expires_at: result.rows[0]?.expires_at || null
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;