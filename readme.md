# Number Cipher — Multiplayer Guessing Game

A real-time multiplayer number guessing game. No login required.

## How to Play

1. **Create a game** — you get a 6-character invite code and a random avatar/username
2. **Share the code** — other players join using the code
3. **Set your secret number** — each player picks a number between 1 and 100, hidden from everyone else
4. **Take turns guessing** — each turn, the guesser tries to guess the next player's secret number
5. **Target responds** — if the guess is wrong, the target says Higher or Lower. If correct, it's automatically detected and the target is eliminated
6. **Last one standing wins** — the player whose number is never guessed wins

## Tech Stack

- [Next.js 16](https://nextjs.org) — App Router
- [Supabase](https://supabase.com) — Postgres database + Realtime subscriptions
- [shadcn/ui](https://ui.shadcn.com) — UI components
- [Framer Motion](https://www.framer.com/motion) — animations
- [next-themes](https://github.com/pacocoursey/next-themes) — dark mode

## Getting Started

```bash
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
