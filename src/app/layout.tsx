import type { Metadata } from 'next'
import './globals.css'
import '@/styles/apple-design-system.css'
import '@/styles/directory-layout.css'

export const metadata: Metadata = {
  title: 'Heaton Employee Directory',
  description: 'Employee directory for Heaton Eye Associates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}