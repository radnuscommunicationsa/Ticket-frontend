import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TicketDesk — IT Support',
  description: 'IT Support Ticket Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
