# Deep Detective

A cryptocurrency investigation platform that analyzes crypto projects for legitimacy, scams, and security risks. Built with React, TypeScript, Vite, and Node.js.

## Features

- **Crypto Investigation**: Search and investigate cryptocurrencies by name or symbol
- **3-Step Analysis Pipeline**: 
  - **Planner**: Generates crypto-specific search queries
  - **Eyes**: Scrapes web data using Tavily API (news, security audits, exchange hacks)
  - **Brain**: Analyzes results with Google Gemini AI to generate risk scores
- **Legitimacy Scoring**: Automated risk assessment (0-100) with verdicts: "LIKELY RISKY", "SORT OF RISKY", or "SAFE"
- **Comparison Tool**: Compare multiple cryptocurrencies side-by-side
- **Share Investigations**: Generate shareable links for investigation results
- **Comment Threads**: Add comments and discussions on specific findings
- **Real-time Agent Logs**: Track investigation progress in real-time
- **Evidence Board**: Visual display of investigation findings organized by category

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Radix UI** + **shadcn/ui** (UI components)
- **React Router** (routing)
- **TanStack Query** (state management)

### Backend
- **Node.js** + **Express** (API server)
- **Tavily API** (web scraping/search)
- **MiniMax AI** (analysis and scoring)
- **CORS** (cross-origin support)
- **dotenv** (environment variables)

## Prerequisites

- **Node.js 18+**
- **npm**, **yarn**, or **pnpm**
- **API Keys**:
  - Tavily API key
  - Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd deep-detective-clean
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
TAVILY_API_KEY=your_tavily_api_key_here
MINIMAX_API_KEY=your_minimax_api_key_here
```

## Development

### Run Frontend and Backend Together (Recommended)

```bash
npm run dev:all
```

This starts both servers concurrently:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

### Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Project Structure

```
deep-detective-clean/
├── server.js              # Express backend server
├── .env                   # Environment variables (create this)
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── AgentLog.tsx
│   │   ├── CaseInput.tsx
│   │   ├── FindingComments.tsx
│   │   ├── ManilaFolder.tsx
│   │   ├── ShareInvestigation.tsx
│   │   └── VerdictPanel.tsx
│   ├── pages/            # Page components
│   │   ├── Index.tsx     # Home/input page
│   │   ├── Results.tsx   # Investigation results
│   │   ├── Comparison.tsx # Comparison view
│   │   └── Shared.tsx    # Shared investigation view
│   ├── lib/              # Utilities and API clients
│   │   ├── api/
│   │   │   └── investigate.ts
│   │   ├── comments.ts
│   │   ├── comparison.ts
│   │   └── sharing.ts
│   ├── types/            # TypeScript definitions
│   └── assets/           # Static assets
├── public/               # Public assets
└── package.json
```

## API Endpoints

### POST `/api/investigate`

Investigate a cryptocurrency.

**Request Body:**
```json
{
  "target": "Bitcoin"
}
```

**Response:**
```json
{
  "plan": ["query1", "query2", "query3"],
  "logs": [
    {
      "query": "Bitcoin crypto scam fraud rug pull",
      "data": [
        {
          "title": "Article Title",
          "content": "Article content...",
          "url": "https://..."
        }
      ]
    }
  ],
  "report": {
    "score": 85,
    "flags": ["flag1", "flag2"],
    "verdict": "Summary verdict..."
  }
}
```

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Testing

```bash
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
```

## Linting

```bash
npm run lint
```

## How It Works

1. **User Input**: Enter a crypto name or symbol (e.g., "Bitcoin", "BTC", "Ethereum")
2. **Planner**: Generates 3 crypto-specific search queries:
   - Crypto scam/fraud/rug pull searches
   - Security audit/vulnerability searches
   - Exchange hack/exploit searches
3. **Eyes**: Executes searches in parallel using Tavily API
4. **Brain**: Aggregates results and sends to MiniMax AI for analysis
5. **Results**: Returns legitimacy score (0-100), red flags, and verdict

## Demo Mode

The backend includes a demo mode for "FTX" that returns a hardcoded high-risk response for demonstration purposes.

## License

MIT
