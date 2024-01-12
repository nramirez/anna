import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Anna Reading Tutor',
  description: 'Friendly reading tutor offering guidance and feedback.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-slate-200 antialiased">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
