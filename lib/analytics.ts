// Google Analytics 4 이벤트 트래킹 유틸리티

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// GA4 이벤트 전송 함수
export const trackEvent = (
  eventName: string,
  eventParams?: {
    [key: string]: string | number | boolean | undefined
  }
) => {
  // 브라우저 환경이고 GA4가 설정되어 있을 때만 실행
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) {
    return
  }

  window.gtag('event', eventName, {
    ...eventParams,
  })
}

// 퀴즈 시작
export const trackQuizStart = () => {
  trackEvent('quiz_start')
}

// 답변 선택
export const trackAnswerSelect = (params: {
  question_number: number
  is_correct: boolean
  time_remaining: number
}) => {
  trackEvent('answer_select', {
    question_number: params.question_number,
    is_correct: params.is_correct,
    time_remaining: Math.round(params.time_remaining * 10) / 10, // 소수점 1자리까지
  })
}

// 퀴즈 완료 (5문제 모두 맞춤)
export const trackQuizComplete = () => {
  trackEvent('quiz_complete')
}

// 퀴즈 실패 (오답 또는 시간 초과)
export const trackQuizFail = (params: {
  question_number: number
  reason: 'wrong_answer' | 'timeout'
}) => {
  trackEvent('quiz_fail', {
    question_number: params.question_number,
    fail_reason: params.reason,
  })
}

// 공유하기 버튼 클릭
export const trackShareClick = (params: {
  screen: 'fail' | 'success'
}) => {
  trackEvent('share_click', {
    screen: params.screen,
  })
}

// 공유 완료 (링크 복사 성공)
export const trackShareComplete = (params: {
  method: 'native_share' | 'clipboard' | 'kakaotalk_modal'
  screen: 'fail' | 'success'
}) => {
  trackEvent('share_complete', {
    share_method: params.method,
    screen: params.screen,
  })
}

// 다시 도전하기 클릭
export const trackRetryClick = () => {
  trackEvent('retry_click')
}

// 보상 받기 클릭
export const trackRewardClaim = () => {
  trackEvent('reward_claim')
}

// 메인으로 돌아가기 클릭
export const trackGoToMain = () => {
  trackEvent('go_to_main')
}
