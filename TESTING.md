# 로컬 테스트 가이드

로컬 서버에서 Supabase 연동이 제대로 작동하는지 테스트하는 방법입니다.

## 1. 환경 변수 확인

프로젝트 루트에 `.env.local` 파일이 있는지 확인하고, 다음 값이 올바르게 설정되어 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**중요**: 환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다.

## 2. 개발 서버 실행

```bash
npm run dev
```

## 3. 브라우저에서 테스트

1. `http://localhost:3000` 접속
2. 개발자 도구(F12) 열기
3. **Console 탭**에서 에러 메시지 확인
4. **Network 탭**에서 API 호출 확인:
   - `/api/user/init` - 유저 초기화
   - `/api/user/tickets` - 도전권 조회/사용
   - `/api/referral/process` - 초대 링크 처리

## 4. Supabase 대시보드에서 확인

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Table Editor** 메뉴 클릭
4. `users` 테이블 확인:
   - 새 유저가 생성되었는지 확인
   - `tickets` 값이 1인지 확인
5. `referrals` 테이블 확인:
   - 초대 링크로 접속한 경우 매칭 기록이 생성되는지 확인

## 5. 테스트 시나리오

### 시나리오 1: 신규 유저 접속
1. 시크릿 모드로 브라우저 열기 (또는 localStorage 초기화)
2. `http://localhost:3000` 접속
3. **확인 사항**:
   - Supabase `users` 테이블에 새 유저 생성
   - `tickets` 값이 1

### 시나리오 2: 초대 링크로 접속
1. 첫 번째 브라우저에서 접속하여 유저 ID 확인 (개발자 도구 → Application → Local Storage → `quizUserId`)
2. 두 번째 브라우저(시크릿 모드)에서 `http://localhost:3000?ref=첫번째유저ID` 접속
3. **확인 사항**:
   - Supabase `referrals` 테이블에 매칭 기록 생성
   - 첫 번째 유저의 `tickets` 값이 2로 증가

### 시나리오 3: 도전권 사용
1. 퀴즈 시작 버튼 클릭
2. **확인 사항**:
   - Supabase `users` 테이블의 `tickets` 값이 1 감소

## 6. 문제 해결

### 데이터가 기록되지 않는 경우

1. **환경 변수 확인**
   ```bash
   # 터미널에서 확인 (Windows PowerShell)
   $env:NEXT_PUBLIC_SUPABASE_URL
   $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   - 값이 비어있으면 `.env.local` 파일을 확인하세요
   - 서버를 재시작했는지 확인하세요

2. **RLS 설정 확인**
   - Supabase 대시보드 → Table Editor → 각 테이블의 Settings
   - RLS가 활성화되어 있다면 정책이 올바르게 설정되었는지 확인
   - 개발 환경에서는 RLS를 비활성화하는 것이 편리합니다

3. **브라우저 콘솔 확인**
   - 에러 메시지가 있는지 확인
   - Network 탭에서 API 호출이 실패했는지 확인

4. **Supabase 연결 테스트**
   - Supabase 대시보드 → Settings → API
   - Project URL과 anon key가 올바른지 확인

### API 호출이 실패하는 경우

1. **CORS 에러**: Supabase 설정에서 허용된 도메인 확인
2. **인증 에러**: anon key가 올바른지 확인
3. **네트워크 에러**: 인터넷 연결 확인

## 7. 로그 확인

서버 터미널에서 다음 메시지들을 확인하세요:
- `Supabase 환경 변수가 설정되지 않았습니다.` → 환경 변수 미설정
- API 라우트에서 에러 발생 시 스택 트레이스 확인
