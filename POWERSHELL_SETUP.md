# PowerShell 실행 정책 해결 방법

PowerShell에서 npm 명령어를 실행하려면 실행 정책을 변경해야 합니다.

## 방법 1: 관리자 권한으로 실행 정책 변경 (권장)

1. **Windows 검색**에서 "PowerShell" 검색
2. **Windows PowerShell**을 **관리자 권한으로 실행** (우클릭 → 관리자 권한으로 실행)
3. 다음 명령어 실행:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

4. `Y` 입력하여 확인

## 방법 2: CMD 사용 (간단한 해결책)

PowerShell 대신 **명령 프롬프트(CMD)**를 사용하세요:

1. Cursor에서 터미널을 열 때 **CMD** 선택
2. 또는 Windows 검색에서 "cmd" 검색하여 실행
3. 프로젝트 폴더로 이동 후 npm 명령어 실행:

```cmd
cd C:\Users\화이트큐브\Desktop\Dev\2601_speed-quiz2
npm install
```

## 방법 3: 일시적으로 Bypass (임시 해결책)

PowerShell에서 다음 명령어로 일시적으로 실행 정책을 우회:

```powershell
powershell -ExecutionPolicy Bypass -Command "npm install"
```

또는:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

## 방법 4: Cursor 터미널 설정 변경

Cursor에서 기본 터미널을 CMD로 변경:

1. Cursor 설정 열기 (Ctrl + ,)
2. "terminal.integrated.defaultProfile.windows" 검색
3. 값을 "Command Prompt" 또는 "cmd"로 변경

## 추천 방법

**방법 2 (CMD 사용)**가 가장 간단하고 빠릅니다. CMD는 실행 정책 제한이 없으므로 바로 npm 명령어를 사용할 수 있습니다.
