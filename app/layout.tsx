import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '스피드 퀴즈 도전',
  description: '성공하면 1만 원! 스피드 퀴즈 도전',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-white min-h-screen">{children}</body>
    </html>
  )
}
