import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Supabase 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: 'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.' },
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

    // 유저의 성공 여부를 true로 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_completed: true })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError || !updatedUser) {
      console.error('성공 여부 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '성공 여부 업데이트 중 오류가 발생했습니다.', details: updateError?.message || '유저 데이터 없음' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      isCompleted: updatedUser.is_completed
    })
  } catch (error) {
    console.error('성공 처리 오류:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: errorMessage },
      { status: 500 }
    )
  }
}
