'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

// 퀴즈 데이터
const quizData = [
  {
    question: '이 제품의 카테고리는 무엇일까요?',
    image: '/q1_tocobo.png',
    answers: ['스킨케어', '메이크업', '선케어', '마스크팩', '헤어케어'],
    correct: 2
  },
  {
    question: '이 제품의 브랜드는 어디일까요?',
    image: '/q2_whitch.jpg',
    answers: ['마녀공장', '웰라쥬', '메디힐', '토리든', '달바'],
    correct: 0
  },
  {
    question: '이 제품의 정확한 이름은 무엇일까요?',
    image: '/q3_wellage.png',
    answers: ['에스트라 아토베리어365 크림', '아누아 피디알엔 히알루론산100 수분크림', '토리든 다이브인 저분자 히알루론산 세럼', '피지오겔 DMT 페이셜 크림', '웰라쥬 리얼 히알루로닉 블루 100 앰플'],
    correct: 4
  },
  {
    question: '빨간색으로 표시된 제품의 정확한 이름은 무엇일까요?',
    image: '/q4_vt.png',
    answers: ['VT 리들샷 100에센스', 'VT 피디알엔 캡슐 크림 100', 'VT 피디알엔 에센스 100', 'VT 리들샷 헤어 부스팅 앰플', 'VT 리들샷 포맨 올인원 100 엠플러스'],
    correct: 2
  },
  {
    question: '빨간색으로 표시된 제품의 정확한 이름은 무엇일까요?',
    image: '/q5_cnp.png',
    answers: ['차앤팍 더마앤서 액티브 부스트 PDRN 앰플', '차앤박 더마앤서 액티브 부스팅 PDRN 앰플', '차앤박 더마앤서 액티브 부스트 PDRN 앰플', '차앤박 더마앤서 액티브 부스트 PDRN 에센스', '차앤박 더마앤서 액티브 부스트 PNDR 에센스'],
    correct: 2
  }
]

// 각 문제별 제한 시간 (초)
const questionTimes = [5, 5, 5, 5, 5]

type Screen = 'main' | 'countdown' | 'quiz' | 'fail' | 'success'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('main')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(5)
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [hasAttempted, setHasAttempted] = useState(false)
  const [hasTicket, setHasTicket] = useState(true)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // 유저 ID 생성 또는 가져오기
  const getUserId = useCallback(() => {
    if (typeof window === 'undefined') return ''
    let userId = localStorage.getItem('quizUserId')
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('quizUserId', userId)
    }
    return userId
  }, [])

  // 도전권 확인
  const hasChallengeTicket = useCallback(() => {
    if (typeof window === 'undefined') return false
    const tickets = parseInt(localStorage.getItem('quizTickets') || '1')
    return tickets > 0
  }, [])

  // 도전권 사용
  const useChallengeTicket = useCallback(() => {
    if (typeof window === 'undefined') return
    const tickets = parseInt(localStorage.getItem('quizTickets') || '1')
    if (tickets > 0) {
      localStorage.setItem('quizTickets', (tickets - 1).toString())
      setHasTicket(tickets - 1 > 0)
    }
  }, [])

  // 도전권 추가
  const addChallengeTicket = useCallback(() => {
    if (typeof window === 'undefined') return
    const tickets = parseInt(localStorage.getItem('quizTickets') || '0')
    localStorage.setItem('quizTickets', (tickets + 1).toString())
    setHasTicket(true)
  }, [])

  // 배열 셔플 함수 (Fisher-Yates 알고리즘)
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  // 선택지 랜덤 섞기 및 정답 인덱스 업데이트
  const shuffleAnswers = useCallback((question: typeof quizData[0]) => {
    const answersWithIndex = question.answers.map((answer, index) => ({
      answer: answer,
      originalIndex: index
    }))
    
    const shuffled = shuffleArray(answersWithIndex)
    const newAnswers = shuffled.map(item => item.answer)
    const correctAnswer = question.answers[question.correct]
    const newCorrectIndex = newAnswers.indexOf(correctAnswer)
    
    return {
      answers: newAnswers,
      correct: newCorrectIndex
    }
  }, [shuffleArray])

  // 초기화 및 추천인 처리
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 유저 초기화
    const userId = getUserId()
    if (!localStorage.getItem('quizTickets')) {
      localStorage.setItem('quizTickets', '1')
      setHasTicket(true)
    } else {
      setHasTicket(hasChallengeTicket())
    }

    // 추천인 처리
    const urlParams = new URLSearchParams(window.location.search)
    const refId = urlParams.get('ref')
    
    if (refId && refId !== userId) {
      const pendingRewards = JSON.parse(localStorage.getItem('quizPendingRewards') || '[]')
      const rewardKey = refId + '_rewarded'
      
      if (!pendingRewards.includes(rewardKey)) {
        pendingRewards.push(rewardKey)
        localStorage.setItem('quizPendingRewards', JSON.stringify(pendingRewards))
        
        const referrerRewards = JSON.parse(localStorage.getItem('quizReferrerRewards') || '{}')
        if (!referrerRewards[refId]) {
          referrerRewards[refId] = 1
        } else {
          referrerRewards[refId] += 1
        }
        localStorage.setItem('quizReferrerRewards', JSON.stringify(referrerRewards))
      }
      
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
    
    // 자신의 ID가 referrerRewards에 있으면 도전권 부여
    const referrerRewards = JSON.parse(localStorage.getItem('quizReferrerRewards') || '{}')
    if (referrerRewards[userId] && referrerRewards[userId] > 0) {
      addChallengeTicket()
      referrerRewards[userId] -= 1
      if (referrerRewards[userId] <= 0) {
        delete referrerRewards[userId]
      }
      localStorage.setItem('quizReferrerRewards', JSON.stringify(referrerRewards))
    }

    // 유저 상태 확인
    const attempted = localStorage.getItem('hasAttempted') === 'true'
    setHasAttempted(attempted)
    
    if (attempted && !hasChallengeTicket()) {
      setScreen('fail')
    }
  }, [getUserId, hasChallengeTicket, addChallengeTicket])

  // 퀴즈 시작
  const startQuiz = useCallback(() => {
    if (!hasChallengeTicket()) {
      alert('도전권이 없습니다. 공유하고 다시 도전하세요.')
      return
    }

    useChallengeTicket()
    setScreen('countdown')
    setCountdownNumber(3)
  }, [hasChallengeTicket, useChallengeTicket])

  // 카운트다운
  useEffect(() => {
    if (screen !== 'countdown') return

    let count = 3
    setCountdownNumber(count)

    const interval = setInterval(() => {
      count--
      if (count > 0) {
        setCountdownNumber(count)
      } else {
        clearInterval(interval)
        setScreen('quiz')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [screen])

  // 문제 시작
  useEffect(() => {
    if (screen !== 'quiz') return

    const originalQuestion = quizData[currentQuestionIndex]
    const questionTime = questionTimes[currentQuestionIndex]
    const shuffled = shuffleAnswers(originalQuestion)

    setShuffledAnswers(shuffled.answers)
    setCorrectIndex(shuffled.correct)
    setTimeLeft(questionTime)

    // 진행바 리셋
    if (progressBarRef.current) {
      progressBarRef.current.style.animation = 'none'
      progressBarRef.current.style.width = '100%'
      void progressBarRef.current.offsetWidth
      setTimeout(() => {
        if (progressBarRef.current) {
          progressBarRef.current.style.animation = `progress ${questionTime}s linear forwards`
        }
      }, 10)
    }

    // 타이머 시작
    const updateInterval = 100
    let elapsed = 0

    timerRef.current = setInterval(() => {
      elapsed += updateInterval
      const remaining = Math.max(0, questionTime - (elapsed / 1000))
      setTimeLeft(remaining)

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        showFailScreen()
      }
    }, updateInterval)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [screen, currentQuestionIndex, shuffleAnswers])

  // 답안 선택
  const selectAnswer = useCallback((index: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (index !== correctIndex) {
      showFailScreen()
      return
    }

    // 정답인 경우
    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= quizData.length) {
      setTimeout(() => {
        showSuccessScreen()
      }, 300)
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(nextIndex)
      }, 500)
    }
  }, [correctIndex, currentQuestionIndex])

  // 실패 화면 표시
  const showFailScreen = useCallback(() => {
    setScreen('fail')
    localStorage.setItem('hasAttempted', 'true')
    setHasAttempted(true)
    setHasTicket(hasChallengeTicket())
  }, [hasChallengeTicket])

  // 성공 화면 표시
  const showSuccessScreen = useCallback(() => {
    setScreen('success')
    localStorage.setItem('hasAttempted', 'true')
    setHasAttempted(true)
  }, [])

  // 공유 URL 생성
  const getShareUrl = useCallback(() => {
    const userId = getUserId()
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
    return baseUrl + '?ref=' + encodeURIComponent(userId)
  }, [getUserId])

  // 공유하고 다시 도전
  const shareAndRetry = useCallback(() => {
    const shareUrl = getShareUrl()
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: '성공하면 1만 원! 스피드 퀴즈 도전',
        text: '제한 시간 초과나 오답 시 즉시 실패!',
        url: shareUrl
      }).catch(() => {
        copyLink(shareUrl)
      })
    } else {
      copyLink(shareUrl)
    }
  }, [getShareUrl])

  // 링크 복사
  const copyLink = useCallback((url: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        alert('링크가 복사되었습니다')
      })
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert('링크가 복사되었습니다')
      } catch (err) {
        alert('링크 복사에 실패했습니다. 수동으로 복사해주세요: ' + url)
      }
      document.body.removeChild(textArea)
    }
  }, [])

  // 메인으로 돌아가기
  const goToMain = useCallback(() => {
    const ticket = hasChallengeTicket()
    const attempted = localStorage.getItem('hasAttempted') === 'true'
    
    if (attempted && !ticket) {
      setScreen('fail')
    } else {
      setScreen('main')
      resetQuiz()
    }
  }, [hasChallengeTicket])

  // 퀴즈 리셋
  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0)
    setTimeLeft(5)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (progressBarRef.current) {
      progressBarRef.current.style.animation = 'none'
      progressBarRef.current.style.width = '100%'
    }
  }, [])

  // 보상 받기
  const claimReward = useCallback(() => {
    window.location.href = 'https://www.google.com'
  }, [])

  const currentQuestion = quizData[currentQuestionIndex]
  const displayTime = timeLeft % 1 === 0 ? timeLeft + '초' : timeLeft.toFixed(1) + '초'

  return (
    <div className="container mx-auto px-5 py-6 max-w-md">
      {/* 메인 화면 */}
      {screen === 'main' && (
        <div className="text-center fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 mt-12">
            <div className="mb-8">
              <div className="inline-block bg-[#F93B4E] bg-opacity-10 rounded-full p-4 mb-6">
                <svg className="w-12 h-12 text-[#F93B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
              성공하면 1만 원!<br /><span className="text-[#F93B4E]">스피드 퀴즈</span> 도전
            </h1>
            <p className="text-gray-600 mb-10 text-base leading-relaxed">
              제한 시간 초과나 오답 시<br />즉시 실패!
            </p>
            <button
              onClick={startQuiz}
              className="w-full bg-[#F93B4E] text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-md hover:shadow-lg hover:bg-[#d83242] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              퀴즈 시작하기
            </button>
          </div>
        </div>
      )}

      {/* 카운트다운 화면 */}
      {screen === 'countdown' && (
        <div className="text-center bg-white">
          <div className="flex items-center justify-center min-h-screen">
            <div className={`text-9xl font-bold text-[#F93B4E] drop-shadow-lg ${countdownNumber > 0 ? 'countdown-animation' : ''}`}>
              {countdownNumber}
            </div>
          </div>
        </div>
      )}

      {/* 퀴즈 화면 */}
      {screen === 'quiz' && currentQuestion && (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-2">
            {/* 진행 상태바 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  문제 <span className="text-[#F93B4E]">{currentQuestionIndex + 1}</span>/5
                </span>
                <span className="text-sm font-semibold text-[#F93B4E]">{displayTime}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  ref={progressBarRef}
                  className="h-full bg-[#F93B4E] progress-bar rounded-full"
                ></div>
              </div>
            </div>

            {/* 문제 내용 */}
            <div className="mb-4">
              <p className="text-lg font-bold text-gray-900 text-center">{currentQuestion.question}</p>
            </div>

            {/* 문제 이미지 */}
            <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
              <Image
                src={currentQuestion.image}
                alt="문제 이미지"
                width={400}
                height={400}
                className="w-full aspect-square object-contain"
                unoptimized
              />
            </div>

            {/* 선택지 버튼 */}
            <div className="space-y-2.5">
              {shuffledAnswers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(index)}
                  className="answer-btn w-full bg-gray-50 hover:bg-[#F93B4E] hover:text-white border border-gray-200 hover:border-[#F93B4E] text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-base font-medium text-left flex items-center h-14"
                >
                  <span>{answer}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 실패 화면 */}
      {screen === 'fail' && (
        <div className="text-center fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 mt-12">
            <div className="mb-8">
              <div className="inline-block bg-red-50 rounded-full p-5 mb-4">
                <svg className="w-16 h-16 text-[#F93B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              앗 아쉬워요!<br />다시 도전해보시겠어요?
            </h2>
            <p className="text-gray-500 text-sm mb-10">한 번 더 기회를 드려요!</p>
            
            <div className="space-y-3 mt-8">
              <button
                onClick={shareAndRetry}
                className="w-full bg-[#F93B4E] text-white font-semibold py-4 px-8 rounded-xl text-base shadow-md hover:shadow-lg hover:bg-[#d83242] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                공유하고 다시 도전하기
              </button>
              {hasTicket && (
                <button
                  onClick={goToMain}
                  className="w-full bg-gray-50 text-gray-700 font-semibold py-4 px-8 rounded-xl text-base border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                >
                  메인으로 돌아가기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 성공 화면 */}
      {screen === 'success' && (
        <div className="text-center fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 mt-12">
            <div className="mb-8">
              <div className="inline-block bg-[#F93B4E] bg-opacity-10 rounded-full p-5 mb-4 pulse-animation">
                <svg className="w-16 h-16 text-[#F93B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              축하합니다!<br />5문제를 모두 맞추셨습니다.
            </h2>
            <p className="text-gray-500 text-sm mb-10">보상을 받아가세요!</p>
            <button
              onClick={claimReward}
              className="w-full bg-[#F93B4E] text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-md hover:shadow-lg hover:bg-[#d83242] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              1만원 받기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
