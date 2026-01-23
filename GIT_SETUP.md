# Git 설정 및 GitHub 업로드 가이드

## 1. Git 저장소 초기화

프로젝트 디렉토리에서 다음 명령어를 실행하세요:

```bash
# Git 저장소 초기화
git init

# 모든 파일 스테이징
git add .

# 첫 커밋
git commit -m "Initial commit: Next.js 스피드 퀴즈 앱"
```

## 2. GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단의 **+** 버튼 클릭 → **New repository** 선택
3. 저장소 정보 입력:
   - **Repository name**: `speed-quiz2` (또는 원하는 이름)
   - **Description**: "성공하면 5천 원! 스피드 퀴즈 도전 앱"
   - **Public** 또는 **Private** 선택
   - ⚠️ **"Initialize this repository with a README"** 체크 해제 (이미 로컬에 파일이 있으므로)
4. **Create repository** 클릭

## 3. 로컬 저장소를 GitHub에 연결

GitHub에서 제공하는 명령어를 사용하거나, 아래 명령어를 사용하세요:

```bash
# GitHub 저장소 URL을 본인의 것으로 변경하세요
# 예: https://github.com/사용자명/speed-quiz2.git
git remote add origin https://github.com/사용자명/저장소명.git

# 기본 브랜치를 main으로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

## 4. 확인

GitHub 저장소 페이지에서 모든 파일이 업로드되었는지 확인하세요.

## 다음 단계

GitHub에 코드가 업로드되면 [DEPLOY.md](./DEPLOY.md)를 참고하여 Vercel에 배포하세요!
