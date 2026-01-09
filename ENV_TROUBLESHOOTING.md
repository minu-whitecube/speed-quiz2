# 환경 변수 문제 해결 가이드

## 확인해야 할 사항들

### 1. 파일 위치 확인
`.env.local` 파일이 **프로젝트 루트 디렉토리**에 있어야 합니다.
```
프로젝트루트/
├── .env.local  ← 여기에 있어야 함
├── package.json
├── next.config.js
└── app/
```

### 2. 파일 이름 확인
- ✅ `.env.local` (정확한 이름)
- ❌ `.env.local.txt` (확장자 추가 안 됨)
- ❌ `env.local` (점 누락)
- ❌ `.env` (다른 파일)

### 3. 환경 변수 형식 확인
**올바른 형식:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**잘못된 형식:**
```env
# 따옴표 사용 안 됨
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"

# 공백 있으면 안 됨
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co

# 주석과 같은 줄에 있으면 안 됨
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co # 주석
```

### 4. 서버 재시작 확인
환경 변수를 변경한 후에는 **반드시** 개발 서버를 재시작해야 합니다:
1. 서버 중지 (Ctrl + C)
2. `npm run dev` 다시 실행

### 5. 파일 인코딩 확인
`.env.local` 파일은 **UTF-8 인코딩**이어야 합니다.
- Windows 메모장: 다른 이름으로 저장 → 인코딩: UTF-8 선택
- VS Code: 우측 하단 인코딩 표시 확인

### 6. 환경 변수 이름 확인
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (대문자, 언더스코어)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (대문자, 언더스코어)
- ❌ `NEXT_PUBLIC_SUPABASE_URL` (대소문자 혼용)
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (오타)

### 7. 값에 특수문자 확인
값에 공백이나 특수문자가 있으면 따옴표로 감싸야 할 수 있습니다:
```env
# 값에 공백이 없으면 따옴표 불필요
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# 값에 공백이 있으면 따옴표 필요 (하지만 일반적으로 필요 없음)
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 8. Next.js 캐시 문제
`.next` 폴더를 삭제하고 다시 시작:
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next
npm run dev
```

### 9. 환경 변수 확인 방법
서버 시작 시 터미널에 다음 메시지가 보이면 환경 변수가 로드된 것입니다:
```
- Environments: .env.local
```

## 디버깅 방법

### 방법 1: API 라우트에서 직접 확인
임시로 API 라우트에 다음 코드 추가:
```typescript
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '설정 안 됨')
```

### 방법 2: 파일 내용 확인
`.env.local` 파일을 열어서 다음을 확인:
- 각 줄이 `KEY=VALUE` 형식인지
- 빈 줄이나 불필요한 공백이 없는지
- 값 앞뒤에 공백이 없는지

## 일반적인 실수

1. **파일을 저장하지 않음** - 파일을 수정한 후 저장(Ctrl+S) 확인
2. **서버를 재시작하지 않음** - 환경 변수 변경 후 반드시 재시작
3. **잘못된 디렉토리에 파일 생성** - `app/` 폴더가 아닌 프로젝트 루트에 생성
4. **환경 변수 이름 오타** - `NEXT_PUBLIC_` 접두사 확인
5. **값에 공백 포함** - URL이나 Key 값 앞뒤에 공백 없어야 함
