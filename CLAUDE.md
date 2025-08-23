# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Run development server**: `npm run dev` (opens at http://localhost:5173)
- **Build for production**: `npm run build`
- **Run linter**: `npm run lint`
- **Preview production build**: `npm run preview`
- **Type checking**: Run `tsc -b` (part of build command)

## Architecture Overview

**Tech Stack**:
- React 19 with TypeScript
- Vite as build tool
- Firebase for auth, database (Firestore), and analytics
- Tailwind CSS v4 with shadcn/ui components
- React Router v7 for routing

**Key Directories**:
- `src/components/ui/`: shadcn/ui-based reusable components
- `src/pages/`: Page-level components (Login, GameLobby, PerudoGame)
- `src/firebase/`: Firebase configuration and initialization
- `src/context/`: React contexts (AuthContext for authentication)
- `src/routes/`: Route guards and protection logic

**Routing Structure**:
- `/`: Login page (public)
- `/gamelobby`: Game lobby (protected)
- `/game/:gameId`: Active game (protected)

**Authentication**:
- Firebase Auth with invite-only signup (uses `VITE_INVITE_CODE`)
- Protected routes via `ProtectedRoute` component
- Auth state managed through `AuthContext`

**Path Aliases**:
- `@/*` maps to `src/*` (configured in tsconfig.json and vite.config.ts)

## UI/UX REDESIGN PROJECT

Do NOT examine files in _old_ui_backup/. 

## Environment Variables

Required `.env` file variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_INVITE_CODE` (for invite-only signup)

## Deployment

- GitHub Actions auto-deploy to Firebase Hosting on push to `main` branch
- Manual deploy available via workflow_dispatch in GitHub UI