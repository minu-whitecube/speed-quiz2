# Git Bash 사용 가이드

Git Bash는 Windows에서 실행 정책 문제 없이 npm 명령어를 실행할 수 있는 훌륭한 대안입니다.

## Cursor에서 Git Bash 사용하기

### 방법 1: 터미널 프로필 변경

1. **Cursor 설정 열기** (Ctrl + ,)
2. 검색창에 `terminal.integrated.defaultProfile.windows` 입력
3. 값을 `Git Bash`로 변경
4. 새 터미널 열기 (Ctrl + `)

### 방법 2: 터미널 드롭다운에서 선택

1. Cursor에서 터미널 열기 (Ctrl + `)
2. 터미널 우측 상단의 **+ 옆 드롭다운** 클릭
3. **"Git Bash"** 선택

## Git Bash에서 npm 명령어 실행

터미널이 Git Bash로 변경되면 바로 사용할 수 있습니다:

```bash
npm install
npm run dev
npm run build
```

## Git Bash 설치 확인

Git Bash가 설치되어 있지 않다면:

1. [Git for Windows 다운로드](https://git-scm.com/download/win)
2. 설치 시 "Git Bash Here" 옵션 선택
3. 설치 완료 후 Cursor 재시작

## Git Bash의 장점

- ✅ 실행 정책 제한 없음
- ✅ Linux/Unix 명령어 사용 가능
- ✅ PowerShell보다 가볍고 빠름
- ✅ 개발자 친화적인 환경

## 주의사항

- 경로에 한글이 있으면 문제가 될 수 있지만, 대부분의 경우 정상 작동합니다
- Git Bash는 기본적으로 `/c/Users/...` 형식의 경로를 사용합니다
