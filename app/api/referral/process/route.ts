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

    const { referrerId, referredId } = await request.json()

    if (!referrerId || !referredId) {
      return NextResponse.json(
        { error: '초대자 ID와 피초대자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 자기 자신을 초대하는 경우 방지
    if (referrerId === referredId) {
      return NextResponse.json(
        { error: '자기 자신을 초대할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 이미 매칭된 관계인지 확인
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러이므로 무시
      console.error('초대 관계 확인 오류:', checkError)
      return NextResponse.json(
        { error: '초대 관계 확인 중 오류가 발생했습니다.', details: checkError.message },
        { status: 500 }
      )
    }

    // 이미 매칭된 관계가 있으면 도전권 부여하지 않음
    if (existingReferral) {
      return NextResponse.json({
        success: false,
        message: '이미 초대된 유저입니다.',
        ticketsAwarded: false
      })
    }

    // 피초대자가 유저 테이블에 존재하는지 확인 (없으면 생성)
    const { data: referredUser, error: referredCheckError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', referredId)
      .single()

    if (referredCheckError && referredCheckError.code === 'PGRST116') {
      // 피초대자가 없으면 생성
      const { error: createError } = await supabase
        .from('users')
        .insert({
          user_id: referredId,
          tickets: 1
        })

      if (createError) {
        console.error('피초대자 유저 생성 오류:', createError)
        return NextResponse.json(
          { error: '피초대자 유저 생성 중 오류가 발생했습니다.', details: createError.message },
          { status: 500 }
        )
      }
    }

    // 초대 관계 생성
    const { data: newReferral, error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId
      })
      .select()
      .single()

    if (insertError) {
      console.error('초대 관계 생성 오류:', insertError)
      return NextResponse.json(
        { error: '초대 관계 생성 중 오류가 발생했습니다.', details: insertError.message },
        { status: 500 }
      )
    }

    // 초대자에게 도전권 부여
    const { data: referrerUser, error: fetchError } = await supabase
      .from('users')
      .select('tickets')
      .eq('user_id', referrerId)
      .single()

    if (fetchError || !referrerUser) {
      return NextResponse.json(
        { error: '초대자 유저를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ tickets: referrerUser.tickets + 1 })
      .eq('user_id', referrerId)
      .select()
      .single()

    if (updateError) {
      console.error('도전권 부여 오류:', updateError)
      return NextResponse.json(
        { error: '도전권 부여 중 오류가 발생했습니다.', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '도전권이 부여되었습니다.',
      ticketsAwarded: true,
      referrerTickets: updatedUser.tickets
    })
  } catch (error) {
    console.error('초대 처리 오류:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: errorMessage },
      { status: 500 }
    )
  }
}
