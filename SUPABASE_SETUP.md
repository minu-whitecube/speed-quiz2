# Supabase 설정 가이드

이 문서는 스피드 퀴즈 앱에 Supabase를 연동하는 방법을 안내합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입/로그인
2. "New Project" 클릭하여 새 프로젝트 생성
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전 설정 후 생성

## 2. 데이터베이스 테이블 생성

Supabase 대시보드에서 SQL Editor를 열고, `supabase/schema.sql` 파일의 내용을 복사하여 실행하세요.

또는 Supabase 대시보드의 Table Editor에서 수동으로 테이블을 생성할 수 있습니다:

### users 테이블
- `user_id` (text, Primary Key)
- `tickets` (integer, Default: 1)
- `created_at` (timestamp with time zone, Default: now())
- `updated_at` (timestamp with time zone, Default: now())

### referrals 테이블
- `id` (serial, Primary Key)
- `referrer_id` (text, Foreign Key → users.user_id)
- `referred_id` (text, Foreign Key → users.user_id)
- `created_at` (timestamp with time zone, Default: now())
- Unique constraint: (referrer_id, referred_id)

## 3. 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일 생성
2. Supabase 대시보드의 Settings → API에서 다음 정보 확인:
   - Project URL
   - anon/public key
3. `.env.local` 파일에 다음 내용 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Row Level Security (RLS) 설정

Supabase는 기본적으로 RLS를 활성화합니다. 이 프로젝트는 공개 API를 사용하므로 RLS를 비활성화하거나 적절한 정책을 설정해야 합니다.

### 옵션 1: RLS 비활성화 (개발 환경용)

Table Editor에서 각 테이블의 RLS를 비활성화:
- users 테이블 → Settings → Disable RLS
- referrals 테이블 → Settings → Disable RLS

### 옵션 2: RLS 정책 설정 (프로덕션 권장)

SQL Editor에서 다음 정책을 추가:

```sql
-- users 테이블: 모든 사용자가 읽기/쓰기 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- referrals 테이블: 모든 사용자가 읽기/쓰기 가능
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on referrals" ON referrals
  FOR ALL USING (true) WITH CHECK (true);
```

## 5. 테스트

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 개발자 도구의 Network 탭에서 API 호출 확인
4. Supabase 대시보드의 Table Editor에서 데이터 확인

## 6. 문제 해결

### API 호출 실패
- 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트의 URL과 Key가 정확한지 확인
- RLS 설정이 올바른지 확인

### 도전권이 부여되지 않음
- Supabase 대시보드에서 referrals 테이블에 데이터가 생성되는지 확인
- users 테이블의 tickets 값이 업데이트되는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

## 7. 배포 시 주의사항

배포 플랫폼(Vercel, Netlify 등)에서도 환경 변수를 설정해야 합니다:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment
