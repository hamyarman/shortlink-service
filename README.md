# Shortlink Service

A simple URL shortener built with Express and SQLite. It includes a small frontend, API endpoints, and Jest/Supertest coverage.

## Features

- Create short links via `POST /api/links`
- Redirect via `GET /:shortCode` while recording clicks
- View stats via `GET /api/links/:shortCode/stats`
- Static frontend in `public/`

## Setup

```bash
npm install
```

## Running the service

```bash
npm start
```

The service listens on `http://localhost:3000` by default.

## Running tests

```bash
npm test
```

## Configuration

- `PORT`: server port (default: 3000)
- `DB_PATH`: SQLite database path (default: `./data/links.db`)
