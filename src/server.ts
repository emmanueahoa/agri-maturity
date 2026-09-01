import express from 'express';
import path from 'path';
import session from 'express-session';
import helmet from 'helmet';
import dotenv from 'dotenv';
import SQLiteStoreFactory from 'connect-sqlite3';
import authRouter from './routes/auth';
import protectedRouter from './routes/protected';
import { requireAuth } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const isProd = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is required in .env');
  process.exit(1);
}

if (isProd) app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const SQLiteStore = SQLiteStoreFactory(session as any);
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, '..', 'db') }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 30
  }
}));

app.use('/api/auth', authRouter);
app.use('/api', protectedRouter);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
