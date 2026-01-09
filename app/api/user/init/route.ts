import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인 (디버깅 로그는 제거)
    
    // Supabase 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.')
      return NextResponse.json(
        { 
          error: 'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.',
          debug: {
            urlExists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            allPublicVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
          }
        },
        { status: 500 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '유저 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 유저가 이미 존재하는지 확인
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_id, tickets, is_completed')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러이므로 무시
      console.error('유저 확인 오류:', checkError)
      return NextResponse.json(
        { error: '유저 확인 중 오류가 발생했습니다.', details: checkError.message },
        { status: 500 }
      )
    }

    // 유저가 이미 존재하면 기존 정보 반환
    if (existingUser) {
      return NextResponse.json({
        userId: existingUser.user_id,
        tickets: existingUser.tickets,
        isCompleted: existingUser.is_completed || false,
        isNew: false
      })
    }

    // 새 유저 생성 (기본 도전권 1개)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        tickets: 1
      })
      .select()
      .single()

    if (insertError) {
      // 중복 키 오류 (23505)인 경우 - 이미 존재하는 유저이므로 다시 조회
      if (insertError.code === '23505') {
        console.log('유저가 이미 존재함, 기존 유저 정보 조회:', userId)
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('user_id, tickets, is_completed')
          .eq('user_id', userId)
          .single()

        if (fetchError || !existingUser) {
          console.error('기존 유저 조회 오류:', fetchError)
          return NextResponse.json(
            { error: '유저 조회 중 오류가 발생했습니다.', details: fetchError?.message },
            { status: 500 }
          )
        }

        return NextResponse.json({
          userId: existingUser.user_id,
          tickets: existingUser.tickets,
          isCompleted: existingUser.is_completed || false,
          isNew: false
        })
      }

      // 다른 오류인 경우
      console.error('유저 생성 오류:', insertError)
      return NextResponse.json(
        { error: '유저 생성 중 오류가 발생했습니다.', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      userId: newUser.user_id,
      tickets: newUser.tickets,
      isCompleted: newUser.is_completed || false,
      isNew: true
    })
  } catch (error) {
    console.error('유저 초기화 오류:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: errorMessage },
      { status: 500 }
    )
  }
}
