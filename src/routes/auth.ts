import express from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import db from '../db/knex';

const router = express.Router();
const BCRYPT_COST = 12;
const MIN_PASSWORD_LEN = 8;
const MAX_FAILED = 5;
const LOCK_SECONDS = 15 * 60;

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (password.length < MIN_PASSWORD_LEN) return res.status(400).json({ error: 'password too short' });
  try {
    const hash = await bcrypt.hash(password, BCRYPT_COST);
    const [id] = await db('users').insert({ email: email.toLowerCase(), password_hash: hash });
    return res.status(201).json({ message: 'created' });
  } catch (err: any) {
    if (err?.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'email exists' });
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing' });
  const user = await db('users').where('email', email.toLowerCase()).first();
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const now = Math.floor(Date.now() / 1000);
  if (user.locked_until && user.locked_until > now) return res.status(429).json({ error: 'account locked' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const attempts = (user.failed_logins || 0) + 1;
    const lock = attempts >= MAX_FAILED ? now + LOCK_SECONDS : null;
    await db('users').where('id', user.id).update({ failed_logins: attempts, locked_until: lock });
    return res.status(401).json({ error: 'invalid credentials' });
  }
  await db('users').where('id', user.id).update({ failed_logins: 0, locked_until: null });
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'session error' });
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.role = user.role;
    return res.json({ message: 'ok', role: user.role });
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'logout error' });
    res.clearCookie('connect.sid');
    res.json({ message: 'logged out' });
  });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'not logged in' });
  res.json({ id: req.session.userId, email: req.session.email, role: req.session.role });
});

export default router;
