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
const questionTimes = [5, 5, 5, 4, 3.5]

type Screen = 'main' | 'countdown' | 'quiz' | 'fail' | 'success'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('main')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(5)
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null)
  const [hasAttempted, setHasAttempted] = useState(false)
  const [hasTicket, setHasTicket] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [tickets, setTickets] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showNoTicketModal, setShowNoTicketModal] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // 유저 ID 생성 또는 가져오기 (localStorage에 저장하여 유지)
  const getOrCreateUserId = useCallback(() => {
    if (typeof window === 'undefined') return ''
    let storedUserId = localStorage.getItem('quizUserId')
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('quizUserId', storedUserId)
    }
    return storedUserId
  }, [])

  // 유저 초기화 (Supabase)
  const initializeUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/user/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('유저 초기화 실패')
      }

      const data = await response.json()
      setTickets(data.tickets)
      setHasTicket(data.tickets > 0)
      return data
    } catch (error) {
      console.error('유저 초기화 오류:', error)
      // 오류 발생 시 기본값 사용
      setTickets(1)
      setHasTicket(true)
    }
  }, [])

  // 도전권 확인
  const hasChallengeTicket = useCallback(() => {
    return tickets > 0
  }, [tickets])

  // 도전권 사용
  const useChallengeTicket = useCallback(async () => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('도전권 사용 실패')
      }

      const data = await response.json()
      setTickets(data.tickets)
      setHasTicket(data.tickets > 0)
    } catch (error) {
      console.error('도전권 사용 오류:', error)
    }
  }, [userId])

  // 도전권 조회
  const fetchTickets = useCallback(async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/user/tickets?userId=${userId}`)
      if (!response.ok) {
        throw new Error('도전권 조회 실패')
      }
      const data = await response.json()
      setTickets(data.tickets)
      setHasTicket(data.tickets > 0)
    } catch (error) {
      console.error('도전권 조회 오류:', error)
    }
  }, [userId])

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

    const initialize = async () => {
      setIsLoading(true)
      
      // 유저 ID 가져오기 또는 생성
      const currentUserId = getOrCreateUserId()
      setUserId(currentUserId)

      // 유저 초기화 (Supabase)
      await initializeUser(currentUserId)

      // 추천인 처리 (URL 파라미터에서 ref 가져오기)
      const urlParams = new URLSearchParams(window.location.search)
      const refId = urlParams.get('ref')
      
      if (refId && refId !== currentUserId) {
        // 초대 링크로 들어온 경우 처리
        try {
          const response = await fetch('/api/referral/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              referrerId: refId,
              referredId: currentUserId,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.ticketsAwarded) {
              // 초대자가 도전권을 받았으므로, 현재 유저는 초대 링크 없이 접속
              // URL에서 ref 파라미터 제거
              const newUrl = window.location.pathname
              window.history.replaceState({}, document.title, newUrl)
            }
          }
        } catch (error) {
          console.error('초대 처리 오류:', error)
        }
      }

      // 유저 상태 확인 (localStorage에 시도 기록은 유지)
      const attempted = localStorage.getItem('hasAttempted') === 'true'
      setHasAttempted(attempted)
      
      // 최신 도전권 수 확인 후 화면 설정
      const latestTicketsResponse = await fetch(`/api/user/tickets?userId=${currentUserId}`)
      if (latestTicketsResponse.ok) {
        const latestTicketsData = await latestTicketsResponse.json()
        const latestTickets = latestTicketsData.tickets || 0
        
        // 도전권 상태 업데이트
        setTickets(latestTickets)
        setHasTicket(latestTickets > 0)
        
        // 이미 시도했고 도전권이 없으면 실패 화면으로 이동
        if (attempted && latestTickets <= 0) {
          setScreen('fail')
        }
      } else {
        // API 호출 실패 시에도 기본값 설정
        setTickets(0)
        setHasTicket(false)
        if (attempted) {
          setScreen('fail')
        }
      }
      
      setIsLoading(false)
    }

    initialize()
  }, [getOrCreateUserId, initializeUser, fetchTickets])

  // 퀴즈 시작
  const startQuiz = useCallback(async () => {
    if (!hasChallengeTicket()) {
      alert('도전권이 없습니다. 공유하고 다시 도전하세요.')
      return
    }

    await useChallengeTicket()
    // 퀴즈 시작 시 문제 인덱스와 상태 리셋
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
    setSelectedAnswerIndex(null) // 문제가 바뀔 때 선택된 답안 리셋

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

  // 실패 화면 표시
  const showFailScreen = useCallback(async () => {
    setScreen('fail')
    localStorage.setItem('hasAttempted', 'true')
    setHasAttempted(true)
    await fetchTickets()
  }, [fetchTickets])

  // 성공 화면 표시
  const showSuccessScreen = useCallback(() => {
    setScreen('success')
    localStorage.setItem('hasAttempted', 'true')
    setHasAttempted(true)
  }, [])

  // 답안 선택
  const selectAnswer = useCallback((index: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // 선택된 답안 표시
    setSelectedAnswerIndex(index)

    if (index !== correctIndex) {
      setTimeout(() => {
        showFailScreen()
      }, 300)
      return
    }

    // 정답인 경우
    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= quizData.length) {
      setTimeout(() => {
        showSuccessScreen()
      }, 500)
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(nextIndex)
      }, 500)
    }
  }, [correctIndex, currentQuestionIndex, showFailScreen, showSuccessScreen])

  // 공유 URL 생성
  const getShareUrl = useCallback(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
    return baseUrl + '?ref=' + encodeURIComponent(userId)
  }, [userId])

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
  const goToMain = useCallback(async () => {
    await fetchTickets()
    const attempted = localStorage.getItem('hasAttempted') === 'true'
    
    if (attempted && tickets <= 0) {
      setScreen('fail')
    } else {
      setScreen('main')
      resetQuiz()
    }
  }, [fetchTickets, tickets])

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

  // 공유 후 다시 도전하기
  const retryAfterShare = useCallback(async () => {
    if (!userId) return
    
    // 최신 도전권 상태 확인
    try {
      const response = await fetch(`/api/user/tickets?userId=${userId}`)
      if (!response.ok) {
        throw new Error('도전권 조회 실패')
      }
      const data = await response.json()
      const currentTickets = data.tickets || 0
      
      if (currentTickets > 0) {
        // 도전권이 있으면 첫 화면으로 이동
        setTickets(currentTickets)
        setHasTicket(true)
        setScreen('main')
        resetQuiz()
      } else {
        // 도전권이 없으면 모달 표시
        setTickets(0)
        setHasTicket(false)
        setShowNoTicketModal(true)
      }
    } catch (error) {
      console.error('도전권 조회 오류:', error)
      alert('도전권을 확인하는 중 오류가 발생했습니다.')
    }
  }, [userId, resetQuiz])

  // 보상 받기
  const claimReward = useCallback(() => {
    window.location.href = 'https://www.google.com'
  }, [])

  const currentQuestion = quizData[currentQuestionIndex]
  const displayTime = timeLeft % 1 === 0 ? timeLeft + '초' : timeLeft.toFixed(1) + '초'

  // 도전권 없음 모달 닫기
  const closeNoTicketModal = useCallback(() => {
    setShowNoTicketModal(false)
  }, [])

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="container mx-auto px-5 py-6 max-w-md">
        <div className="text-center mt-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F93B4E]"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 도전권 없음 모달 */}
      {showNoTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-block bg-blue-50 rounded-full p-4 mb-4">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                도전권이 없어요
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                친구가 아직 링크에 접속하지 않았어요.<br />
                친구가 링크를 클릭해야 도전권이 생겨요
              </p>
              <button
                onClick={closeNoTicketModal}
                className="w-full bg-[#F93B4E] text-white font-semibold py-3 px-6 rounded-xl text-base shadow-md hover:shadow-lg hover:bg-[#d83242] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-2">
            {/* 진행 상태바 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
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
            <div className="mb-3">
              <p className="text-lg font-bold text-gray-900 text-center">{currentQuestion.question}</p>
            </div>

            {/* 문제 이미지 */}
            <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
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
            <div className="space-y-2">
              {shuffledAnswers.map((answer, index) => {
                const isSelected = selectedAnswerIndex === index
                const isCorrect = index === correctIndex && isSelected
                return (
                  <button
                    key={index}
                    onClick={() => selectAnswer(index)}
                    disabled={selectedAnswerIndex !== null}
                    className={`answer-btn w-full border rounded-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-base font-medium text-left flex items-center h-11 px-4 ${
                      isCorrect
                        ? 'bg-[#F93B4E] text-white border-[#F93B4E]'
                        : isSelected
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-gray-50 hover:bg-[#F93B4E] hover:text-white border-gray-200 hover:border-[#F93B4E] text-gray-700'
                    } ${selectedAnswerIndex !== null ? 'cursor-not-allowed' : ''}`}
                  >
                    <span>{answer}</span>
                  </button>
                )
              })}
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
            <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
              앗 아쉬워요!<br />다시 도전해보시겠어요?
            </h2>
            <p className="text-gray-500 text-sm mb-10">링크를 공유하면 한번 더 기회가 생겨요!</p>
            
            <div className="space-y-3 mt-8">
              <button
                onClick={shareAndRetry}
                className="w-full bg-[#F93B4E] text-white font-semibold py-4 px-8 rounded-xl text-base shadow-md hover:shadow-lg hover:bg-[#d83242] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                공유하고 다시 도전하기
              </button>
              <button
                onClick={retryAfterShare}
                className="w-full bg-blue-50 text-blue-700 font-semibold py-4 px-8 rounded-xl text-base border border-blue-200 hover:bg-blue-100 transition-all duration-200"
              >
                공유했어요 다시 할래요!
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
    </>
  )
}
