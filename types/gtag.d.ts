// Google Analytics gtag 타입 정의
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetIdOrEventName: string | Date,
      configOrParams?: {
        page_path?: string
        [key: string]: any
      }
    ) => void
    dataLayer?: any[]
  }
}

export {}
