## VANI

VANI is an AI-powered multilingual conversational intelligence platform for healthcare and finance workflows.

This repo currently contains:

- Next.js frontend in the app router
- Prisma schema for the `vani` MariaDB/MySQL database
- Express API scaffold for dashboard, sessions, search, and analytics endpoints
- Reference SQL queries for your DBMS project demo

## Project structure

```text
app/                   Next.js frontend
components/            frontend UI components
prisma/schema.prisma   Prisma schema mapped to your 12 tables
server/src/            Express + Prisma backend scaffold
sql/select_queries.sql DBMS reference queries
```

## Setup

1. Copy `.env.example` to `.env`.
2. Update `DATABASE_URL` for your local MariaDB instance.
3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client from the schema:

```bash
npm run prisma:generate
```

## Run

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run api:dev
```

Frontend runs at `http://localhost:3000`.
Backend runs at `http://localhost:4000`.

## API routes

- `GET /api/health`
- `GET /api/dashboard/summary?domain=all&days=30`
- `GET /api/sessions?domain=healthcare&limit=20`
- `GET /api/sessions/:id`
- `GET /api/search/patients?q=ravi`
- `GET /api/search/customers?q=loan`
- `GET /api/analytics/overview`

## Prisma notes

- Provider is `mysql`, which works for MariaDB in Prisma.
- Your local DB should stay `vani`.
- If you already created tables manually, use `npm run prisma:generate`.
- Use `npm run prisma:db-pull` only if you want Prisma to introspect and overwrite schema details from the live database.

## DBMS query reference

Reference queries are in `sql/select_queries.sql`. They cover:

- dashboard metrics
- session joins
- patient and customer search
- analytics aggregation
- daily snapshot insertion
