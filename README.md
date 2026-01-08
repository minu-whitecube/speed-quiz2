# 스피드 퀴즈 도전

성공하면 1만 원! 스피드 퀴즈 도전 앱입니다.

## 프로젝트 구조

```
speed-quiz2/
├── app/
│   ├── globals.css      # 전역 스타일 및 애니메이션
│   ├── layout.tsx       # 루트 레이아웃
│   └── page.tsx         # 메인 페이지 컴포넌트
├── public/              # 정적 파일 (이미지 등)
│   ├── q1_tocobo.png
│   ├── q2_whitch.jpg
│   ├── q3_wellage.png
│   ├── q4_vt.png
│   └── q5_cnp.png
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 이미지 파일 추가

다음 이미지 파일들을 `public/` 폴더에 추가해주세요:

- `q1_tocobo.png`
- `q2_whitch.jpg`
- `q3_wellage.png`
- `q4_vt.png`
- `q5_cnp.png`

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 배포

### Vercel 배포 (권장)

자세한 배포 가이드는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

**빠른 배포 단계:**

1. **GitHub에 코드 업로드**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Next.js 스피드 퀴즈 앱"
   # GitHub에서 새 저장소 생성 후
   git remote add origin https://github.com/사용자명/저장소명.git
   git branch -M main
   git push -u origin main
   ```

2. **Vercel에 배포**
   - [Vercel](https://vercel.com)에 가입/로그인 (GitHub 계정 권장)
   - "New Project" 클릭
   - GitHub 저장소 선택
   - 빌드 설정은 자동으로 감지됩니다
   - "Deploy" 클릭

### 다른 플랫폼 배포

Next.js는 다양한 플랫폼에서 배포할 수 있습니다:
- Netlify
- AWS Amplify
- Cloudflare Pages
- 자체 서버 (Node.js 환경 필요)

## 주요 기능

- ⏱️ 제한 시간 내 퀴즈 풀기
- 🎯 5문제 연속 정답 시 성공
- 🎫 도전권 시스템 (공유 시 추가 도전권 획득)
- 📱 반응형 디자인
- 🎨 부드러운 애니메이션 효과

## 기술 스택

- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 CSS 프레임워크
- **React Hooks** - 상태 관리

## 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.
