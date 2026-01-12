import type { Metadata } from 'next'
import './globals.css'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  title: '챌린저스 스피드퀴즈',
  description: '답을 알 것 같다면 퀴즈에 도전하세요. 퀴즈를 모두 맞추면 1만 원을 드려요.',
  openGraph: {
    title: '퀴즈 맞추고 1만 원 받기',
    description: '이미지를 보고 알맞은 답을 골라요.',
    images: [
      {
        url: '/og_image.png',
        width: 1200,
        height: 630,
        alt: '퀴즈 맞추고 1만 원 받기',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '퀴즈 맞추고 1만 원 받기',
    description: '이미지를 보고 알맞은 답을 골라요.',
    images: ['/og_image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-white min-h-screen">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
