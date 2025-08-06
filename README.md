# BIOCON.NS Interactive Stock Game

An interactive web application that visualizes BIOCON.NS stock data and turns it into a guessing game.

## Features

- Loads 1 year of BIOCON.NS daily stock data
- Plays through the data like a 2-minute clip (auto-advances ~1 day every ~300ms)
- Pauses whenever the price "touches 390" (i.e., day's low ≤ 390 ≤ day's high)
- Asks "Up or Down next?" and records your guess
- Immediately reveals the real path and continues until the next 390 touch
- Shows a running score

## Tech Stack

- Vite + React
- TypeScript
- Recharts for data visualization
- Tailwind CSS + shadcn/ui for UI components

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

### Build

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Simple Server

Run a simple HTTP server for local testing:

```bash
npm run serve
```

### Deployment

#### Vercel Deployment

Deploy to Vercel production:

```bash
npm run deploy
```

Create a preview deployment:

```bash
npm run deploy:preview
```

**Note:** You need to have the Vercel CLI installed and be logged in to use these commands. Install it with:

```bash
npm install -g vercel
vercel login
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Project Structure

Due to environment constraints, this project uses a flat file structure with prefixes:

- `src-*.tsx/ts/css` - Source files
- `src-components-*.tsx` - UI components
- `src-lib-*.ts` - Utility functions

## Data Source

The application uses a pre-built JSON file containing 1 year of BIOCON.NS daily stock data to avoid CORS/API hassles.
