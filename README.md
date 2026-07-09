# GrowEasy AI CSV Importer

An AI-powered CSV importer that intelligently extracts CRM lead information from **any valid CSV format** — regardless of column names, layouts, or structure.

## Overview

The challenge is not parsing CSV files. The challenge is handling CSVs with arbitrary column names (Facebook Lead Exports, Google Ads Exports, Real Estate CRM dumps, manually created spreadsheets) and intelligently mapping them into the standardized GrowEasy CRM schema using AI.

This application uses **Gemini 2.5 Flash** to semantically understand CSV column meanings and extract structured CRM records — no hardcoded column mappings.

## Features

- **Drag & Drop + File Picker** CSV upload
- **Instant client-side CSV preview** with sticky headers and scrollable table
- **Confirm-before-import** flow (no AI processing until user confirms)
- **Batch AI processing** with configurable batch size
- **Automatic retry** with exponential backoff on AI failures
- **Structured results** showing imported records, skipped records, and summary stats
- **Paginated results table** with CRM status color coding
- **Dark mode toggle** (persisted via localStorage, respects system preference)
- **Responsive design** for desktop, tablet, and mobile
- **Type-safe** end to end with TypeScript

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Tables | TanStack Table v8 |
| CSV Parsing (client) | Papa Parse |
| File Upload (client) | React Dropzone |
| Backend | Node.js, Express, TypeScript |
| CSV Parsing (server) | csv-parser |
| File Upload (server) | Multer |
| AI | Google Gemini 2.5 Flash |
| Validation | Zod |
| Containerization | Docker + Docker Compose |

## Project Structure

```
groweasy-csv-importer/
├── apps/
│   ├── frontend/
│   │   ├── app/                   # Next.js App Router
│   │   ├── components/
│   │   │   ├── DropZone.tsx       # Drag & Drop upload
│   │   │   ├── PreviewTable.tsx   # CSV preview table
│   │   │   ├── ProcessingView.tsx # Loading/progress UI
│   │   │   └── ResultsView.tsx    # Import results display
│   │   ├── lib/
│   │   │   ├── api.ts             # Backend API client
│   │   │   └── csvUtils.ts        # Client-side CSV utilities
│   │   └── types/                 # TypeScript types
│   │
│   └── backend/
│       └── src/
│           ├── config/            # App configuration
│           ├── controllers/       # Route controllers
│           ├── middleware/        # Express middleware
│           ├── prompts/           # AI extraction prompts
│           ├── routes/            # API routes
│           ├── services/
│           │   ├── ai/            # Gemini AI service
│           │   └── csv/           # CSV parser service
│           ├── types/             # TypeScript types
│           ├── utils/             # Utilities (logger, chunks, sleep)
│           └── validators/        # Request validation
│
├── sample-csvs/                   # Sample CSV files for testing
├── docker-compose.yml
└── README.md
```

## Installation & Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A [Google AI Studio](https://aistudio.google.com) API key (free)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd groweasy-csv-importer
```

### 2. Set up the backend

```bash
cd apps/backend
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=4000
NODE_ENV=development
BATCH_SIZE=100
AI_MAX_RETRIES=3
```

Install dependencies and start:

```bash
npm install
npm run dev
```

Backend runs at `http://localhost:4000`

### 3. Set up the frontend

```bash
cd apps/frontend
```

The `.env.local` file is pre-configured for local development. Install and start:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## Running with Docker

From the project root:

```bash
# Create a .env file with your API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Build and start both services
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key (required) | — |
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `BATCH_SIZE` | CSV rows per AI batch | `100` |
| `AI_MAX_RETRIES` | Max AI retry attempts | `3` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000/api` |

## API Reference

### `POST /api/import`

Upload a CSV file for AI-powered CRM extraction.

**Request:** `multipart/form-data` with a `file` field containing the CSV.

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": [
      {
        "created_at": "2026-05-13T14:20:48.000Z",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "country_code": "+91",
        "mobile_without_country_code": "9876543210",
        "company": "GrowEasy",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "lead_owner": "test@gmail.com",
        "crm_status": "GOOD_LEAD_FOLLOW_UP",
        "crm_note": "",
        "data_source": "",
        "possession_time": "",
        "description": ""
      }
    ],
    "skipped": [
      { "row": 5, "reason": "No email or phone number found", "data": {} }
    ],
    "total": 10,
    "totalImported": 9,
    "totalSkipped": 1
  }
}
```

### `GET /api/health`

Health check endpoint.

## AI Field Mapping

The AI handles semantic field mapping — it understands that these all mean the same thing:

| CRM Field | Example CSV Column Names |
|-----------|--------------------------|
| `name` | Customer Name, Lead Name, Full Name, Person, Prospect, Contact |
| `email` | Email, Mail, Email Address, Primary Email, Contact Email |
| `mobile` | Phone, Mobile, Cell, Telephone, WhatsApp, Contact Number |
| `company` | Company, Organization, Business, Firm, Employer |
| `city` | City, Town, Location, Area, Locality |
| `crm_status` | Status, Lead Status, Stage, Quality, Pipeline Stage |
| `data_source` | Source, Lead Source, Channel, Campaign, Platform |

### Allowed CRM Status Values
- `GOOD_LEAD_FOLLOW_UP` — Interested, warm lead, wants follow-up
- `DID_NOT_CONNECT` — Not reachable, no response, busy
- `BAD_LEAD` — Not interested, junk, wrong number
- `SALE_DONE` — Deal closed, converted, purchased

### Allowed Data Source Values
- `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`

## Sample CSV Files

Test the importer with the included sample files in `/sample-csvs/`:

| File | Description |
|------|-------------|
| `facebook-leads.csv` | Facebook lead export format |
| `google-ads-export.csv` | Google Ads export with campaign columns |
| `real-estate-crm.csv` | Real estate CRM dump with non-standard headers |

## Deployment

### Frontend — Vercel

```bash
cd apps/frontend
npx vercel --prod
```

Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`

### Backend — Railway

```bash
cd apps/backend
# Push to GitHub and connect via Railway dashboard
# Set environment variables in Railway dashboard
```

> **Important:** When deploying the backend, set `ALLOWED_ORIGINS` to your frontend's hosted URL (e.g. `https://your-app.vercel.app`) to allow CORS.

## Screenshots

| Step | Description |
|------|-------------|
| Upload | Drag & drop or click to browse |
| Preview | Instant CSV preview with scrollable table |
| Processing | Progress steps during AI extraction |
| Results | Stats + paginated CRM table with status badges |
