'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  trackQuizStart,
  trackAnswerSelect,
  trackQuizComplete,
  trackQuizFail,
  trackShareClick,
  trackShareComplete,
  trackRetryClick,
  trackRewardClaim,
  trackGoToMain,
} from '@/lib/analytics'

// 퀴즈 데이터
const quizData = [
  {
    question: '이 제품의 카테고리는 무엇일까요?',
    image: '/q1_drg.png',
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
    answers: ['헤라 블랙쿠션', '청미정 다시마 샴푸', '메디힐 에센셜 마스크팩', '롬앤 더 쥬시 래스팅팅', '웰라쥬 리얼 히알루로닉 블루 100 앰플'],
    correct: 4
  },
  {
    question: '빨간색 제품의 정확한 이름은 무엇일까요?',
    image: '/q4_vt.png',
    answers: ['VT 리들샷 100에센스', 'VT 피디알엔 캡슐 크림 100', 'VT 피디알엔 에센스 100', 'VT 리들샷 헤어 부스팅 앰플', 'VT 리들샷 포맨 올인원 100 엠플러스'],
    correct: 2
  },
  {
    question: '빨간색 제품의 정확한 이름은 무엇일까요?',
    image: '/q5_cnp.png',
    answers: ['차앤팍 더마앤서 액티브 부스트 PDRN 앰플', '차앤박 더마앤서 액티브 부스팅 PDRN 앰플', '차앤박 더마앤서 액티브 부스트 PDRN 앰플', '차앤박 더마앤서 액티브 부스트 PDRN 에센스', '차앤박 더마앤서 액티브 부스트 PNDR 에센스'],
    correct: 2
  }
]

// 각 문제별 제한 시간 (초)
const questionTimes = [5, 4.8, 4.5, 3.7, 2.7]

type Screen = 'main' | 'countdown' | 'quiz' | 'fail' | 'success'

export default function Home() {
  const router = useRouter()
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
  const [isCompleted, setIsCompleted] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const preloadedImagesRef = useRef<Set<string>>(new Set())

  // 이벤트 종료 체크
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // 환경 변수로 이벤트 종료 여부 확인
    const isEventEnded = process.env.NEXT_PUBLIC_EVENT_ENDED === 'true'
    
    if (isEventEnded) {
      router.push('/event-ended')
    }
  }, [router])

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

  // localStorage에서 캐시된 유저 데이터 가져오기
  const getCachedUserData = useCallback(() => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem('userDataCache')
      if (!cached) return null
      
      const data = JSON.parse(cached)
      const cacheAge = Date.now() - data.timestamp
      const maxAge = 5 * 60 * 1000 // 5분 캐시 유효 시간
      
      if (cacheAge > maxAge) {
        localStorage.removeItem('userDataCache')
        return null
      }
      
      return data
    } catch (error) {
      return null
    }
  }, [])

  // 유저 데이터를 localStorage에 캐시
  const cacheUserData = useCallback((tickets: number, isCompleted: boolean) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('userDataCache', JSON.stringify({
        tickets,
        isCompleted,
        timestamp: Date.now()
      }))
    } catch (error) {
      // 캐시 실패는 무시 (필수 기능이 아님)
    }
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
      setIsCompleted(data.isCompleted || false)
      // 캐시 업데이트
      cacheUserData(data.tickets, data.isCompleted || false)
      return data
    } catch (error) {
      console.error('유저 초기화 오류:', error)
      // 오류 발생 시 기본값 사용
      setTickets(1)
      setHasTicket(true)
    }
  }, [cacheUserData])

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
      // 캐시 업데이트
      const cachedData = getCachedUserData()
      if (cachedData) {
        cacheUserData(data.tickets, cachedData.isCompleted)
      }
    } catch (error) {
      console.error('도전권 사용 오류:', error)
    }
  }, [userId, getCachedUserData, cacheUserData])

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
      // 캐시 업데이트
      const cachedData = getCachedUserData()
      if (cachedData) {
        cacheUserData(data.tickets, cachedData.isCompleted)
      }
    } catch (error) {
      console.error('도전권 조회 오류:', error)
    }
  }, [userId, getCachedUserData, cacheUserData])

  // 이미지 프리로드 함수
  const preloadImage = useCallback((src: string) => {
    if (preloadedImagesRef.current.has(src)) return
    
    const img = new window.Image()
    img.src = src
    preloadedImagesRef.current.add(src)
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

    const initialize = async () => {
      // 유저 ID 가져오기 또는 생성 (동기 처리)
      const currentUserId = getOrCreateUserId()
      setUserId(currentUserId)

      // 유저 상태 확인 (localStorage에 시도 기록은 유지) - 동기 처리
      const attempted = localStorage.getItem('hasAttempted') === 'true'
      setHasAttempted(attempted)

      // 캐시된 유저 데이터 먼저 확인
      const cachedData = getCachedUserData()
      if (cachedData) {
        // 캐시된 데이터로 먼저 화면 표시 (낙관적 UI)
        setTickets(cachedData.tickets)
        setHasTicket(cachedData.tickets > 0)
        setIsCompleted(cachedData.isCompleted || false)
        
        // 캐시된 데이터로 화면 결정
        if (cachedData.isCompleted) {
          setScreen('success')
        } else if (attempted && cachedData.tickets <= 0) {
          setScreen('fail')
        }
      } else {
        // 캐시가 없으면 기본값 사용
        setTickets(1)
        setHasTicket(true)
        setIsCompleted(false)
      }

      // 로딩 완료 - 화면 먼저 표시 (캐시된 데이터 또는 기본값 사용)
      setIsLoading(false)

      // API 호출은 백그라운드에서 수행 (화면 로딩을 블로킹하지 않음)
      initializeUser(currentUserId).then(userData => {
        if (!userData) return

        // API 결과로 상태 업데이트
        if (userData.isCompleted) {
          setScreen('success')
        } else if (attempted && (userData.tickets || 0) <= 0) {
          setScreen('fail')
        }
      }).catch(error => {
        console.error('유저 초기화 오류:', error)
      })

      // 추천인 처리 (URL 파라미터에서 ref 가져오기) - 백그라운드 처리
      const urlParams = new URLSearchParams(window.location.search)
      const refId = urlParams.get('ref')
      
      const processReferral = async () => {
        if (refId && refId !== currentUserId) {
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
              // 추천인 처리 후 도전권 상태 업데이트
              await initializeUser(currentUserId)
            }
          } catch (error) {
            console.error('초대 처리 오류:', error)
          }
        }
      }

      // 추천인 처리는 백그라운드에서 실행 (화면 로딩을 블로킹하지 않음)
      processReferral().catch(error => {
        console.error('추천인 처리 중 오류:', error)
      })
    }

    initialize()
  }, [getOrCreateUserId, initializeUser, getCachedUserData])

  // 퀴즈 시작
  const startQuiz = useCallback(async () => {
    // 성공한 유저는 퀴즈를 다시 시작할 수 없음
    if (isCompleted) {
      setScreen('success')
      return
    }
    
    if (!hasChallengeTicket()) {
      alert('도전권이 없습니다. 공유하고 다시 도전하세요.')
      return
    }

    trackQuizStart()
    
    // Optimistic UI: API 호출을 기다리지 않고 먼저 카운트다운 화면으로 전환
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
    
    // 도전권 사용 API 호출은 백그라운드에서 처리 (화면 전환을 블로킹하지 않음)
    useChallengeTicket().catch(error => {
      console.error('도전권 사용 오류:', error)
      // 에러 발생 시에도 사용자 경험을 방해하지 않도록 처리
    })
  }, [hasChallengeTicket, useChallengeTicket, isCompleted])

  // 카운트다운
  useEffect(() => {
    if (screen !== 'countdown') return

    // 카운트다운 중에 첫 번째 문제 이미지 프리로드
    if (quizData.length > 0) {
      preloadImage(quizData[0].image)
      // 두 번째 문제 이미지도 미리 로드
      if (quizData.length > 1) {
        preloadImage(quizData[1].image)
      }
    }

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
  }, [screen, preloadImage])

  // 실패 화면 표시
  const showFailScreen = useCallback(async (failReason?: { question_number: number; reason: 'wrong_answer' | 'timeout' }) => {
    if (failReason) {
      trackQuizFail(failReason)
    }
    setScreen('fail')
    localStorage.setItem('hasAttempted', 'true')
    setHasAttempted(true)
    await fetchTickets()
  }, [fetchTickets])

  // 성공 화면 표시
  const showSuccessScreen = useCallback(async () => {
    trackQuizComplete()
    setScreen('success')
    localStorage.setItem('hasAttempted', 'true')
    setHasAttempted(true)
    setIsCompleted(true)
    
    // 캐시 업데이트 (성공 상태로)
    const cachedData = getCachedUserData()
    if (cachedData) {
      cacheUserData(cachedData.tickets, true)
    }
    
    // 서버에 성공 여부 업데이트 (백그라운드에서 처리하여 화면 전환 속도 향상)
    if (userId) {
      fetch('/api/user/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      }).then(() => {
        // API 성공 후 캐시도 업데이트
        const cachedData = getCachedUserData()
        if (cachedData) {
          cacheUserData(cachedData.tickets, true)
        }
      }).catch(error => {
        console.error('성공 여부 업데이트 오류:', error)
      })
    }
  }, [userId, getCachedUserData, cacheUserData])

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

    // 다음 문제의 이미지 프리로드 (다음 문제가 있는 경우)
    if (currentQuestionIndex + 1 < quizData.length) {
      const nextQuestion = quizData[currentQuestionIndex + 1]
      preloadImage(nextQuestion.image)
    }

    // 진행바 리셋
    if (progressBarRef.current) {
      progressBarRef.current.style.animation = 'none'
      progressBarRef.current.style.width = '100%'
      void progressBarRef.current.offsetWidth
      // requestAnimationFrame을 사용하여 더 부드럽게 처리
      requestAnimationFrame(() => {
        if (progressBarRef.current) {
          progressBarRef.current.style.animation = `progress ${questionTime}s linear forwards`
        }
      })
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
        showFailScreen({
          question_number: currentQuestionIndex + 1,
          reason: 'timeout',
        })
      }
    }, updateInterval)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [screen, currentQuestionIndex, shuffleAnswers, preloadImage, showFailScreen])

  // 답안 선택
  const selectAnswer = useCallback((index: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // 선택된 답안 표시
    setSelectedAnswerIndex(index)

    const isCorrect = index === correctIndex
    // 답변 선택 이벤트 트래킹
    trackAnswerSelect({
      question_number: currentQuestionIndex + 1,
      is_correct: isCorrect,
      time_remaining: timeLeft,
    })

    if (!isCorrect) {
      // 오답인 경우 빠른 전환 (300ms -> 250ms)
      setTimeout(() => {
        showFailScreen({
          question_number: currentQuestionIndex + 1,
          reason: 'wrong_answer',
        })
      }, 250)
      return
    }

    // 정답인 경우 - 딜레이 단축 (500ms -> 300ms)
    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= quizData.length) {
      setTimeout(() => {
        showSuccessScreen()
      }, 300)
    } else {
      // 다음 문제로 전환 (500ms -> 300ms)
      setTimeout(() => {
        setCurrentQuestionIndex(nextIndex)
      }, 300)
    }
  }, [correctIndex, currentQuestionIndex, showFailScreen, showSuccessScreen])

  // 공유 URL 생성
  const getShareUrl = useCallback(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
    return baseUrl + '?ref=' + encodeURIComponent(userId)
  }, [userId])

  // 공유 텍스트 생성 (메시지 + 링크)
  const getShareText = useCallback(() => {
    const shareUrl = getShareUrl()
    return `답을 알 것 같다면 퀴즈에 도전하세요. 
퀴즈를 모두 맞추면 1만 원을 드려요.
${shareUrl}`
  }, [getShareUrl])

  // 링크 복사 (iOS Safari 최적화)
  const copyLink = useCallback((url: string) => {
    // iOS Safari를 포함한 최신 브라우저에서 Clipboard API 사용
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        alert('링크가 복사되었습니다')
      }).catch(() => {
        // Clipboard API 실패 시 iOS Safari에 최적화된 fallback 사용
        fallbackCopyTextToClipboard(url)
      })
    } else {
      // Clipboard API를 지원하지 않는 경우
      fallbackCopyTextToClipboard(url)
    }

    // iOS Safari를 포함한 모든 브라우저에서 작동하는 fallback 함수
    function fallbackCopyTextToClipboard(text: string) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      
      // iOS에서는 textarea를 사용하되 더 안정적인 방법 적용
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.top = '0'
      textArea.style.left = '0'
      textArea.style.width = '2em'
      textArea.style.height = '2em'
      textArea.style.padding = '0'
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.boxShadow = 'none'
      textArea.style.background = 'transparent'
      textArea.style.opacity = '0'
      textArea.setAttribute('readonly', '')
      
      document.body.appendChild(textArea)
      
      if (isIOS) {
        // iOS Safari에서는 특별한 처리 필요
        const range = document.createRange()
        range.selectNodeContents(textArea)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
        textArea.setSelectionRange(0, text.length)
        textArea.contentEditable = 'true'
        textArea.readOnly = false
      } else {
        textArea.focus()
        textArea.select()
      }
      
      try {
        // iOS에서는 execCommand가 제한적으로 작동하므로 사용자 선택 영역에 의존
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          alert('링크가 복사되었습니다')
        } else if (isIOS) {
          // iOS에서 자동 복사가 실패한 경우 사용자에게 직접 선택할 수 있도록 안내
          showManualCopyOption(text)
        } else {
          alert('링크 복사에 실패했습니다. 수동으로 복사해주세요: ' + text)
        }
      } catch (err) {
        document.body.removeChild(textArea)
        // iOS에서는 사용자에게 직접 복사할 수 있도록 안내
        if (isIOS) {
          showManualCopyOption(text)
        } else {
          alert('링크 복사에 실패했습니다. 수동으로 복사해주세요: ' + text)
        }
      }
    }

    // iOS에서 자동 복사가 실패한 경우 수동 복사 옵션 제공
    function showManualCopyOption(text: string) {
      const copyDiv = document.createElement('div')
      copyDiv.style.position = 'fixed'
      copyDiv.style.top = '50%'
      copyDiv.style.left = '50%'
      copyDiv.style.transform = 'translate(-50%, -50%)'
      copyDiv.style.backgroundColor = 'white'
      copyDiv.style.padding = '20px'
      copyDiv.style.borderRadius = '8px'
      copyDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
      copyDiv.style.zIndex = '10000'
      copyDiv.style.maxWidth = '90%'
      copyDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      
      const message = document.createElement('p')
      message.textContent = '링크를 선택하여 복사하세요'
      message.style.margin = '0 0 10px 0'
      message.style.fontSize = '14px'
      message.style.color = '#333'
      
      const textInput = document.createElement('input')
      textInput.type = 'text'
      textInput.value = text
      textInput.readOnly = true
      textInput.style.width = '100%'
      textInput.style.padding = '10px'
      textInput.style.border = '1px solid #ddd'
      textInput.style.borderRadius = '4px'
      textInput.style.fontSize = '14px'
      textInput.style.boxSizing = 'border-box'
      
      // iOS에서 탭하면 자동으로 전체 선택되도록
      textInput.addEventListener('focus', () => {
        textInput.select()
      })
      
      textInput.addEventListener('click', () => {
        textInput.select()
      })
      
      const closeBtn = document.createElement('button')
      closeBtn.textContent = '닫기'
      closeBtn.style.marginTop = '10px'
      closeBtn.style.width = '100%'
      closeBtn.style.padding = '10px'
      closeBtn.style.backgroundColor = '#F93B4E'
      closeBtn.style.color = 'white'
      closeBtn.style.border = 'none'
      closeBtn.style.borderRadius = '4px'
      closeBtn.style.cursor = 'pointer'
      closeBtn.style.fontSize = '14px'
      
      closeBtn.onclick = () => {
        document.body.removeChild(copyDiv)
      }
      
      copyDiv.appendChild(message)
      copyDiv.appendChild(textInput)
      copyDiv.appendChild(closeBtn)
      document.body.appendChild(copyDiv)
      
      // 자동으로 포커스하여 선택 (iOS에서 작동)
      setTimeout(() => {
        textInput.focus()
        textInput.select()
      }, 100)
    }
  }, [])

  // 공유하고 다시 도전
  const shareAndRetry = useCallback((screenType: 'fail' | 'success' = 'fail') => {
    trackShareClick({ screen: screenType })
    const shareUrl = getShareUrl()
    
    // 카카오톡 브라우저 감지
    const isKakaoTalk = typeof navigator !== 'undefined' && /KAKAOTALK|KAKAO/i.test(navigator.userAgent)
    
    if (isKakaoTalk) {
      // 카카오톡 브라우저에서는 공유 모달 표시
      setShowShareModal(true)
      return
    }
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      // iOS 감지
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      
      // iOS에서는 text에 URL을 포함시켜야 공유 시트에서 링크 복사가 제대로 작동함
      const shareData: { title?: string; text?: string; url?: string } = {
        title: '성공하면 1만 원! 챌린저스 스피드퀴즈',
      }
      
      if (isIOS) {
        // iOS에서는 text에 URL을 포함 (공유 시트에서 링크 복사 시 URL이 포함되도록)
        shareData.text = '답을 아시겠나요? 퀴즈에 도전하세요.\n퀴즈를 모두 맞추면 1만 원을 드려요.\n\n' + shareUrl
      } else {
        // 다른 플랫폼에서는 text와 url을 분리
        shareData.text = '답을 아시겠나요? 퀴즈에 도전하세요.\n퀴즈를 모두 맞추면 1만 원을 드려요.'
        shareData.url = shareUrl
      }
      
      navigator.share(shareData)
        .then(() => {
          trackShareComplete({ method: 'native_share', screen: screenType })
        })
        .catch(() => {
          // 공유 취소 시 링크 복사
          copyLink(shareUrl)
          trackShareComplete({ method: 'clipboard', screen: screenType })
        })
    } else {
      // navigator.share를 지원하지 않는 경우 링크 복사
      copyLink(shareUrl)
      trackShareComplete({ method: 'clipboard', screen: screenType })
    }
  }, [getShareUrl, copyLink])

  // 메인으로 돌아가기
  const goToMain = useCallback(async () => {
    trackGoToMain()
    // 성공한 유저는 메인으로 돌아갈 수 없음
    if (isCompleted) {
      setScreen('success')
      return
    }
    
    await fetchTickets()
    const attempted = localStorage.getItem('hasAttempted') === 'true'
    
    if (attempted && tickets <= 0) {
      setScreen('fail')
    } else {
      setScreen('main')
      resetQuiz()
    }
  }, [fetchTickets, tickets, isCompleted])

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
    trackRetryClick()
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
    trackRewardClaim()
    if (!userId) return
    const rewardUrl = `https://tally.so/r/NplZ6l?utm_source=viral&utm_content=${encodeURIComponent(userId)}`
    window.location.href = rewardUrl
  }, [userId])

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
      {/* 공유 모달 (카카오톡 브라우저용) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-block bg-blue-50 rounded-full p-4 mb-4">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                공유하기
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                아래 내용을 복사하여<br />
                카카오톡 대화방에 붙여넣으세요
              </p>
              <div className="mb-4">
                <button
                  onClick={() => {
                    copyLink(getShareText())
                    const currentScreen = screen === 'success' ? 'success' : 'fail'
                    trackShareComplete({ method: 'kakaotalk_modal', screen: currentScreen })
                    setShowShareModal(false)
                  }}
                  className="w-full bg-[#F93B4E] text-white font-semibold py-3 px-6 rounded-xl text-base shadow-md hover:shadow-lg hover:bg-[#d83242] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mb-3"
                >
                  메시지와 링크 복사하기
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl text-base border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div className="mb-0 -mt-16">
              <div className="inline-block mb-0">
                <Image
                  src="/logo_challengers.png"
                  alt="챌린저스 로고"
                  width={96}
                  height={96}
                  className="w-48 h-48 object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight -mt-12">
              성공하면 1만 원!<br /><span className="text-[#F93B4E]">스피드 퀴즈</span> 도전
            </h1>
            <p className="text-gray-600 mb-4 text-base leading-relaxed">
              문제를 읽고 사진에 알맞은<br />정답을 고르세요
            </p>
            <p className="text-gray-500 mb-10 text-sm">
              정해진 인원이 모두 성공하면 이벤트가 종료돼요
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
                priority={currentQuestionIndex === 0}
                loading={currentQuestionIndex === 0 ? 'eager' : 'lazy'}
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
                    className={`answer-btn w-full border rounded-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-sm font-medium text-left flex items-center h-11 px-4 ${
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
            <p className="text-gray-500 text-sm ">링크를 공유하면 한번 더 기회가 생겨요!</p>
            <p className="text-gray-500 text-sm mb-10">(도전권은 최대 1개까지 보유 가능해요)</p>
            
            <div className="space-y-3 mt-8">
              <button
                onClick={() => shareAndRetry('fail')}
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
            <div className="space-y-3">
              <button
                onClick={claimReward}
                className="w-full bg-[#F93B4E] text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-md hover:shadow-lg hover:bg-[#d83242] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                1만원 받기
              </button>
              <button
                onClick={() => shareAndRetry('success')}
                className="w-full bg-blue-500 text-white font-semibold py-4 px-8 rounded-xl text-base shadow-md hover:shadow-lg hover:bg-blue-600 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                친구에게 공유하기
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
