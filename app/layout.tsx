import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yellow PvP Wager Demo',
  description: 'Phase 1 Demo - Real-time Off-chain Betting with Yellow Network',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
