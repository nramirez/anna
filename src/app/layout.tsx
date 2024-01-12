import { type Metadata } from 'next'

import './tailwind.css'

export const metadata: Metadata = {
  title: {
    template: 'Anna Reading Tutor',
    default:
      'Friendly reading tutor offering guidance and feedback.',
  },
  description:
    'Friendly reading tutor offering guidance and feedback.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-slate-200 antialiased">
      <body className="flex min-h-full">
        <div className="w-full">{children}</div>
      </body>
    </html>
  )
}
