# Agri Maturity — Rebuild (Node + Express + SQLite + TypeScript)

This branch contains the initial scaffold for the rebuild using TypeScript, Express, Knex (SQLite), and a static frontend.

Quick start (development):

1. Install dependencies

   npm install

2. Create .env from .env.example and set SESSION_SECRET

3. Initialize DB (migrations + seed)

   npm run init-db

4. Start dev server

   npm run dev

Open http://localhost:3000

Docker: use docker-compose up --build to run with the included compose file.
