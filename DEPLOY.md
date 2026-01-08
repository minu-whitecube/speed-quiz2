# 배포 가이드

이 프로젝트를 Vercel에 배포하는 방법을 안내합니다.

## 1. GitHub에 코드 업로드

### Git 저장소 초기화 (아직 안 했다면)

```bash
git init
git add .
git commit -m "Initial commit: Next.js 스피드 퀴즈 앱"
```

### GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단의 **+** 버튼 클릭 → **New repository** 선택
3. 저장소 이름 입력 (예: `speed-quiz2`)
4. **Public** 또는 **Private** 선택
5. **"Initialize this repository with a README"** 체크 해제 (이미 로컬에 파일이 있으므로)
6. **Create repository** 클릭

### 로컬 저장소를 GitHub에 연결

GitHub에서 제공하는 명령어를 사용하거나, 아래 명령어를 사용하세요:

```bash
# GitHub 저장소 URL을 본인의 것으로 변경하세요
git remote add origin https://github.com/사용자명/speed-quiz2.git
git branch -M main
git push -u origin main
```

## 2. Vercel에 배포

### 방법 1: GitHub 연동 (권장)

1. [Vercel](https://vercel.com)에 가입/로그인
   - GitHub 계정으로 로그인하는 것을 권장합니다

2. **New Project** 클릭

3. GitHub 저장소 선택
   - 방금 만든 `speed-quiz2` 저장소를 선택하세요

4. 프로젝트 설정
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)

5. **Environment Variables** (필요한 경우)
   - 현재 프로젝트는 환경 변수가 필요 없습니다

6. **Deploy** 클릭

7. 배포 완료!
   - 배포가 완료되면 자동으로 URL이 생성됩니다
   - 예: `https://speed-quiz2.vercel.app`

### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 실행
vercel

# 첫 배포 시
# - Set up and deploy? Yes
# - Which scope? 본인의 계정 선택
# - Link to existing project? No
# - Project name? speed-quiz2 (또는 원하는 이름)
# - Directory? ./
# - Override settings? No

# 프로덕션 배포
vercel --prod
```

## 3. 배포 후 확인사항

### 이미지 파일 확인
- `public/` 폴더의 이미지 파일들이 제대로 로드되는지 확인
- 이미지 경로가 `/q1_tocobo.png` 형식으로 올바르게 설정되어 있는지 확인

### 기능 테스트
- [ ] 메인 화면 표시
- [ ] 퀴즈 시작 버튼 동작
- [ ] 카운트다운 동작
- [ ] 퀴즈 문제 표시
- [ ] 타이머 동작
- [ ] 정답/오답 처리
- [ ] 성공/실패 화면 표시
- [ ] 공유 기능 동작
- [ ] localStorage 동작 (도전권 시스템)

## 4. 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드에서 프로젝트 선택
2. **Settings** → **Domains** 클릭
3. 도메인 입력 후 **Add** 클릭
4. DNS 설정 안내에 따라 도메인을 연결

## 5. 환경 변수 설정 (필요한 경우)

만약 나중에 API 키나 환경 변수가 필요하다면:

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Environment Variables** 클릭
3. 변수 추가 후 **Save**
4. 재배포 필요

## 6. 자동 배포

GitHub와 연동하면:
- `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다
- Pull Request를 만들면 Preview 배포가 생성됩니다

## 문제 해결

### 빌드 오류가 발생하는 경우
- `npm run build`를 로컬에서 실행하여 오류 확인
- Vercel 대시보드의 **Deployments** 탭에서 로그 확인

### 이미지가 표시되지 않는 경우
- 이미지 파일이 `public/` 폴더에 있는지 확인
- 이미지 경로가 `/`로 시작하는지 확인 (예: `/q1_tocobo.png`)

### 환경 변수 오류
- `.env.local` 파일은 Git에 커밋되지 않습니다
- Vercel 대시보드에서 환경 변수를 설정해야 합니다
