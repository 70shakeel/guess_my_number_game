# Number Cipher — Multiplayer Guessing Game

> A real-time multiplayer number guessing game. No login required.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-guess--my--number-yellow?style=for-the-badge&logo=vercel)](https://guess-my-number-game-9fi1.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

---

## Screenshots

### Home Page

![Number Cipher Home Page](https://shot.screenshotapi.net/screenshot?token=&url=https%3A%2F%2Fguess-my-number-game-9fi1.vercel.app&width=1280&height=720&output=image&file_type=png&wait_for_event=load)

### Game Lobby

![Number Cipher Game Lobby](https://shot.screenshotapi.net/screenshot?token=&url=https%3A%2F%2Fguess-my-number-game-9fi1.vercel.app%2Fgame%2Fb2bf8b87-1b8a-48fc-8d49-4968b6c506c3&width=1280&height=720&output=image&file_type=png&wait_for_event=load)

---

## How to Play

1. **Create a game** — you get a 6-character invite code and a random avatar/username
2. **Share the code** — other players join using the code
3. **Set your secret number** — each player picks a number between 1 and 100, hidden from everyone else
4. **Take turns guessing** — each turn, the guesser tries to guess the next player's secret number
5. **Target responds** — if the guess is wrong, the target says Higher or Lower. If correct, it's automatically detected and the target is eliminated
6. **Last one standing wins** — the player whose number is never guessed wins

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | App Router, SSR |
| [Supabase](https://supabase.com) | Postgres DB + Realtime subscriptions |
| [shadcn/ui](https://ui.shadcn.com) | UI components |
| [Framer Motion](https://www.framer.com/motion) | Animations |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark mode |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Live Demo

**[https://guess-my-number-game-9fi1.vercel.app](https://guess-my-number-game-9fi1.vercel.app)**
