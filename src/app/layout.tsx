import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://guess-my-number-game.vercel.app'),
  title: 'Number Cipher — Multiplayer Guessing Game',
  description: 'A real-time multiplayer number guessing game. No login required. Create a game, share the code, last one standing wins.',
  openGraph: {
    title: 'Number Cipher — Multiplayer Guessing Game',
    description: 'A real-time multiplayer number guessing game. No login required. Create a game, share the code, last one standing wins.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Number Cipher — Multiplayer Guessing Game',
    description: 'A real-time multiplayer number guessing game. No login required.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
