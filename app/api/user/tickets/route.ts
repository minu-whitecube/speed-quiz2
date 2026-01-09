import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 도전권 조회
export async function GET(request: NextRequest) {
  try {
    // Supabase 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: 'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '유저 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .select('tickets')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('도전권 조회 오류:', error)
      return NextResponse.json(
        { error: '도전권 조회 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ tickets: data?.tickets || 0 })
  } catch (error) {
    console.error('도전권 조회 오류:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: errorMessage },
      { status: 500 }
    )
  }
}

// 도전권 사용
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

    // 현재 도전권 확인
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('tickets')
      .eq('user_id', userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: '유저를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (user.tickets <= 0) {
      return NextResponse.json(
        { error: '도전권이 없습니다.' },
        { status: 400 }
      )
    }

    // 도전권 차감
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ tickets: user.tickets - 1 })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('도전권 사용 오류:', updateError)
      return NextResponse.json(
        { error: '도전권 사용 중 오류가 발생했습니다.', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tickets: updatedUser.tickets,
      success: true
    })
  } catch (error) {
    console.error('도전권 사용 오류:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: errorMessage },
      { status: 500 }
    )
  }
}
