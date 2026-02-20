import type { Metadata } from 'next'
import { Roboto_Condensed, Source_Sans_3 } from 'next/font/google'
import './globals.css'
import '@/styles/heaton-design-system.css'
import '@/styles/directory-layout.css'

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-heading',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Staff Directory | Heaton Eye Associates',
  description: 'Internal staff directory for Heaton Eye Associates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${robotoCondensed.variable} ${sourceSans.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
