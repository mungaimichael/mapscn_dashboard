# MapScn Dashboard

A modern dashboard application built with React, TypeScript, and Vite.

## Features

- **React 19 & TypeScript:** Modern, type-safe UI development.
- **Vite:** Lightning-fast cold server start and HMR.
- **MapLibre GL:** Interactive mapping capabilities.
- **Tailwind CSS:** Utility-first styling with `tailwindcss-animate` and `tw-animate-css`.
- **UI Components:** Styled with `shadcn` and `@base-ui/react`.
- **Data Fetching:** `@tanstack/react-query` for asynchronous state management.
- **Icons:** `lucide-react` for beautiful and consistent iconography.
- **Multi-Tenancy:** Dynamic context loading based on environment variables or URL query parameters to serve different markets.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

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

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Multi-Tenancy Testing

The application supports simulated multi-tenancy based on market context. This affects the default language, map center, and other market-specific configurations.

By default, the app loads the **Kenya** context (English, centered on Nairobi). 

To switch contexts locally during development, you can append the `?tenant=<id>` query parameter to your URL:

- **Kenya (Default)**: `http://localhost:3000/?tenant=ke`
- **Nigeria**: `http://localhost:3000/?tenant=ng` (Centered on Lagos)
- **Tanzania**: `http://localhost:3000/?tenant=tz` (Loads Swahili by default, centered on Dar es Salaam)

Alternatively, you can set the `VITE_TENANT_ID` environment variable before running the development server.

## Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the application for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run preview`: Previews the locally built production application.
