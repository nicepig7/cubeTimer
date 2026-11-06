# QQTimer 코드 분석 및 현대화 진행 보고서

## 1. 개요 (Overview)
- **프로젝트 명**: qqTimer (Speedcubing Timer & Scramble Generator)
- **위치**: `d:\temp\ferdyTemp\qqtimer`
- **목적**: 큐브/퍼즐 솔빙 시간 측정, 스크램블 생성, 통계 산출(Ao5, Ao12 등), 세션 관리 웹 애플리케이션의 버그 픽스 및 UI/UX 현대화

---

## 2. 작업 완료 내역

### ✅ 1단계: 버그 픽스 및 기본 정리 (Completed)
1. **스크립트 파일 확장자 정상화**:
   - `qqTimer_files/` 내의 `.다운로드` 파일 3개를 정상 확장자로 정리:
     - `scramble_333_edit.js.다운로드` → `scramble_333_edit.js`
     - `scramble_sq1.js.다운로드` → `scramble_sq1.js`
     - `scramble_slidy.js.다운로드` → `scramble_slidy.js`
2. **CSS 경로 정상화 및 누락 파일 보완**:
   - 누락되었던 `style1.css` 생성 및 호환용 루트 CSS 동기화
   - 원본 버전 백업: `qqTimer_legacy.html` 생성 (클래식 UI 유지)
3. **스크램블러 모듈 분리 및 검증**:
   - 1,140라인의 스크램블 생성 로직을 `qqTimer_files/scramblers.js`로 독립 분리
   - Node.js 환경에서 3x3, 2x2, Pyraminx, Skewb, 4x4 WCA 등 57개 퍼즐 카테고리 스크램블 생성 정상 작동 검증 완료.
4. **3x3x3 솔버 초기화 이슈 픽스**:
   - min2phase 솔버의 `randomSource`가 기본적으로 `undefined`로 선언되어 발생하는 `Cannot read properties of undefined (reading 'random')` 오류 수정
   - `Math` 객체를 기본 PRNG로 자동 주입 및 로드 시 테이블 자동 초기화(`initialize(null, Math)`) 보장.

### ✅ 2단계: UI/UX 현대화 & 3x3x3 집중 인터페이스 (Completed)
1. **3x3x3 전용 깔끔한 상단 헤더 (Clean & Minimalist)**:
   - 복잡한 57개 퍼즐 선택 및 길이 입력창을 걷어내고, 3x3 스피드큐빙에 꼭 필요한 핵심 옵션으로 간소화
   - 3x3 연습 모드(WCA 기본, PLL 연습, Last Layer, F2L, 2-Gen, Roux) 및 세션(1~25) 선택만 전면에 배치
2. **세련된 다크모드 & 글래스모피즘 디자인 (`modern.css`)**:
   - 심우주 옵시디언 톤 배경(`radial-gradient`) 및 프로스트 글래스 카드 효과(`backdrop-filter: blur(20px)`)
   - 네온 악센트 컬러(일렉트릭 사이언, 에메랄드, 앰버, 크림슨) 및 타이머 상태별 아우라 발광 효과
   - `Outfit`, `Inter`, `JetBrains Mono` 폰트 적용
   - 반응형 모바일/태블릿/데스크톱 대응 그리드 레이아웃
2. **초정밀 타이머 엔진 (`app.js`)**:
   - `performance.now()` 기반 밀리초 이하 고정밀 시간 측정
   - `requestAnimationFrame` 적용으로 60fps/120fps 부드러운 시간 렌더링
   - WCA 스택맷 스타일 스페이스바 준비 로직:
     - 스페이스바 누름: 앰버 컬러(`HOLDING`)
     - 300ms 이상 홀드 시: 에메랄드 컬러 점등(`READY`) + 알림음
     - 스페이스바 뗄 시: 즉시 타이머 시작(`RUNNING`)
     - 임의의 키 입력 또는 터치 시: 즉시 정밀 정지
   - 모바일 터치스크린 타이밍 지원
3. **WCA 15초 인스펙션 모드**:
   - 15초 카운트다운 및 8초, 12초 경고음
   - 15초 초과 시 +2초 자동 부가, 17초 초과 시 DNF 자동 처리
4. **실시간 통계 및 평균 분석 (Inspector)**:
   - Best Single(PB 표시), Worst Single, Current/Best Ao5, Ao12, Mo3, Ao50, Ao100, Session Mean/SD
   - 통계 카드 클릭 시 해당 평균을 구성하는 개별 기록 및 절삭(Trimmed) 값 표시
   - 솔브 리스트에서 원클릭 +2, DNF, 코멘트 메모, 삭제 지원
5. **완벽한 세션 호환성**:
   - 1~25번 세션 전환 지원
   - 기존 qqTimer의 `localStorage` 포맷(`session{id}`) 100% 호환
   - 솔브 기록 텍스트 복사/붙여넣기 기반 Import/Export 모달 탑재
6. **Web Audio API 사운드**:
   - 외부 오디오 파일 의존성 없는 네이티브 사운드 신디사이징 (Ready, Start, Stop, Inspection 경고)

### ✅ 3단계: CFOP 해법 이미지 표준화 및 자동 추출 파이프라인 (Completed)
1. **해법 치트시트 정밀 이미지 분석**:
   - `f2l_yshoon17.jpg` (600x1800, 2열 21행 42개 셀)
   - `oll_yshoon17.jpg` (730x2910, 2열 29행 57개 공식)
   - `pll_vr2_yshoon17.jpg` (500x1802, 1열 21개 공식)
2. **PLL 특수 조건 완벽 구현**:
   - 각 행의 앞부분에 있는 2개 그림 중 **첫 번째 2D 노란색 탑뷰 화살표만 정밀 크롭**하고, 두 번째 3D 큐브 블록 교환 그림은 자동 스킵.
3. **아이콘 규격 통일 & 캔버스 노멀라이즈**:
   - 128x128 정사각형 캔버스 중앙 정렬 및 외곽 격자선 노이즈 완전 제거.
   - 총 120개 무결점 아이콘 자산 생성 (`solve/icons/f2l/`, `oll/`, `pll/`).
4. **CFOP 무결점 JSON 데이터베이스 구축**:
   - `solve/solutions.json`: 단계별(F2L, OLL, PLL), 그룹별, 케이스명, 공식 텍스트 및 상대 아이콘 경로 매핑 완료.
5. **추출 자동화 도구**:
   - `tools/extract_solutions.py`: 실행 1초 만에 120개 아이콘과 JSON, JS 데이터베이스를 일괄 추출·생성하는 Python 스크립트.

### ✅ 4단계: qqTimer 웹 UI 연동 & 1920x1080 고정 2열 레이아웃 (Completed)
1. **1920×1080 최적화 고정 크기 모달 (`1420px × 820px`)**:
   - 가변 높이로 인한 출렁거림(Jitter)을 완전히 제거하기 위해 폭(1420px)과 높이(820px)를 고정.
   - 탭이나 페이지를 전환해도 크기 변동 없이 견고한 데스크톱 애플리케이션 느낌 제공.
2. **2열 가로형 행(Row) 카드 배치 (좌측 상자 + 우측 해법 한 줄)**:
   - 원본 치트시트처럼 왼쪽에는 52px 큐브 아이콘, 오른쪽에는 케이스 명칭과 공식이 나란히 배치.
   - **공식 텍스트 줄바꿈 완전 제거 (`white-space: nowrap`)**: 넓은 2열 그리드로 긴 회전 공식도 한 줄로 시원하게 표시.
3. **직관적인 양손 지원 2단계 단축키 시스템**:
   - **메인 단계 이동**: `1` (F2L), `2` (OLL), `3` (PLL) (숫자키 및 Numpad 지원)
   - **하위 페이지 이동 (양손 완벽 대응)**:
     - **왼손 포지션**: `Q` (1페이지), `W` (2페이지), `E` (3페이지), `R` (4페이지), `T` (5페이지), `Y` (6페이지)
     - **오른손 키패드 포지션**: `Num 4` (1페이지), `Num 5` (2페이지), `Num 6` (3페이지), `Num 7` (4페이지), `Num 8` (5페이지), `Num 9` (6페이지)
     - *키패드 `1, 2, 3`으로 단계를 고르고 `4, 5, 6, 7, 8`로 하위 페이지를 선택하면 오른손 한 손만으로도 모든 조작 가능!*
     - *한글 자음 상태('ㅂ, ㅈ, ㄷ, ㄱ, ㅅ, ㅛ')에서도 물리 키코드(`KeyQ~Y`)로 인식하여 100% 정상 작동.*
   - **PLL 최적화**: 중복되는 '전체' 탭을 제거하고, 4개 핵심 그룹(코너&엣지, 인접교환, G-Perm, 대각교환)으로 정돈하여 한눈에 확인 가능.
   - **방향키 이동**: `←` / `→` (이전 / 다음 페이지)
   - **닫기**: `ESC` 또는 `Space` (스페이스바 누르면 즉시 창이 닫히며 타이머 홀드 시작)
4. **원클릭 복사 & 실시간 검색**:
   - 카드를 클릭하면 공식 텍스트가 클립보드에 즉시 복사되고 토스트 알림 표시.
   - 공식명, 케이스명, 알고리즘 실시간 검색 지원.
5. **로컬 파일 더블클릭(`file://`) & 웹 서버 동시 완벽 지원**:
   - `solutions_data.js`를 동시 생성 및 로드하여 브라우저 CORS 제약 없이 더블클릭만으로 즉시 구동 가능.

### ✅ 5단계: 실시간 솔빙 연동 & 타이머 유지 UX 개선 (Completed)
1. **솔빙 중 치트시트 열람 시 타이머 연속 유지**:
   - 큐브를 맞추는 도중(`RUNNING` 상태) 공식이 생각나지 않아 `1` (F2L), `2` (OLL), `3` (PLL)을 눌러도 타이머가 정지되지 않고 백그라운드에서 실시간으로 계속 정밀 시간 측정 유지.
   - 치트시트 내부에서 하위 페이지 전환 단축키(`Q~T`, 키패드 `4~8`, 방향키 `←/→`) 및 닫기(`ESC`)를 눌러도 타이머가 멈추지 않음.
   - 큐브를 다 맞춘 후 `Space`를 누르면 치트시트가 즉시 닫히며 타이머가 정지되고 최종 기록이 안전하게 저장됨.
2. **치트시트 좌측 상단 실시간 라이브 타이머 탑재 (`#cheatSheetLiveTimer`)**:
   - 치트시트 모달 헤더 좌측에 에메랄드 펄스 점멸 인디케이터(`●`)와 대형 모노스페이스 디지털 시계 배치.
   - 솔빙 중 치트시트를 띄웠을 때 흐르고 있는 초를 실시간 60fps로 바로 확인 가능.
   - 대기 상태(`IDLE`/`READY`)에서도 상태 텍스트와 타이머 시간이 깔끔하게 표시되어 레이아웃 흔들림 없음.
3. **단축키 뱃지 시각화 간소화 (`Q`, `W`, `E`, `R`, `T`)**:
   - 하위 탭 뱃지의 복잡했던 `Q / 4` 표기를 사용자 요청에 따라 직관적인 `Q`, `W`, `E`, `R`, `T`로 심플하게 정돈.
   - 시각 표기는 심플해졌지만, 오른손 키패드 `4, 5, 6, 7, 8`과 한글 자음(`ㅂ, ㅈ, ㄷ, ㄱ, ㅅ`) 입력 매핑은 100% 그대로 지원되어 양손 입력 기능 완벽 유지.

### ✅ 6단계: 모듈 분리 리팩토링 및 GitHub Pages 배포 준비 (Completed)
1. **1,530여 라인의 거대 단일 파일 `app.js` 모듈 분리**:
   - 단일 파일에 밀집되어 있던 관심사를 `qqTimer_files/js/` 하위의 6개 독립 모듈로 깔끔하게 분리:
     - `audio.js`: Web Audio API 신디사이저 (`QQTimer.Audio`)
     - `storage.js`: qqTimer 레거시 포맷 호환 LocalStorage 세션 저장/불러오기 (`QQTimer.Storage`)
     - `stats.js`: WCA 절삭 평균(Ao5, Ao12, Ao50, Ao100), Mo3, 표본 표준편차, 포맷터 (`QQTimer.Stats`)
     - `timer.js`: 고정밀 `performance.now()`, `rAF` 루프, 15초 인스펙션 상태 머신 (`QQTimer.TimerEngine`)
     - `cheatsheet.js`: CFOP 해법 모달, 2열 카드 렌더링, 검색, 양손 단축키, 라이브 타이머 연동 (`QQTimer.CheatSheet`)
     - `importExport.js`: 솔브 데이터 텍스트 임포트/익스포트 파서 (`QQTimer.ImportExport`)
   - 메인 `app.js`는 DOM 캐싱, 전역 상태 조율, 이벤트 바인딩만 담당하는 초슬림 조율자(Orchestrator, ~500라인)로 경량화.
2. **`file://` 더블클릭 & GitHub Pages 100% 동시 호환 아키텍처**:
   - 빌드 도구(Webpack/Vite 등)가 필요한 ES Module 대신, **네임스페이스 모듈 패턴 (`window.QQTimer = { ... }`)** 적용.
   - 로컬에서 `index.html`을 더블클릭(`file:///...`)해도 브라우저 CORS 제약 없이 즉시 구동.
   - 모든 스크립트와 리소스 경로가 상대 경로(`.` 기준)로 작성되어 GitHub Pages의 서브패스(`username.github.io/repo/`)에서도 무수정 즉시 배포 가능.
   - GitHub Pages의 Jekyll 정적 사이트 빌더 간섭을 방지하는 `.nojekyll` 파일 추가.

---

## 3. 최종 파일 구성 (모듈화 클린 아키텍처)

```
qqtimer/
├── README.md                      (본 보고서)
├── .nojekyll                      (★ GitHub Pages 정적 파일 직접 서빙 설정)
├── index.html                     (★ GitHub Pages 및 웹 서버 기본 진입점)
├── qqTimer.html                   (로컬 실행용 별칭 HTML)
├── tools/
│   └── extract_solutions.py       (CFOP 해법 아이콘/데이터 일괄 추출 자동화 도구)
├── solve/
│   ├── f2l_yshoon17.jpg           (F2L 원본 치트시트)
│   ├── oll_yshoon17.jpg           (OLL 원본 치트시트)
│   ├── pll_vr2_yshoon17.jpg       (PLL 원본 치트시트)
│   ├── solutions.json             (정형화된 CFOP 120개 해법 JSON 데이터베이스)
│   ├── solutions_data.js          (로컬 file:// 더블클릭 호환 JS 데이터베이스)
│   └── icons/                     (정밀 추출된 128x128 표준 아이콘 120개)
│       ├── f2l/                   (f2l_case_01A.png ~ 23B.png: 42개)
│       ├── oll/                   (oll_case_01.png ~ 57.png: 57개)
│       └── pll/                   (pll_case_01.png ~ 21.png: 21개)
└── qqTimer_files/
    ├── modern.css                 (글래스모피즘 모던 디자인 스타일시트)
    ├── app.js                     (★ 초경량 메인 오케스트레이터)
    ├── scramblers.js              (3x3x3 WCA/PLL/LL/F2L/2-Gen/Roux 전용 스크램블러)
    ├── scramble_333_edit.js       (3x3x3 min2phase 무작위 상태 솔버)
    └── js/                        (★ 기능별 분리 모듈)
        ├── audio.js               (Web Audio 사운드 신디사이저)
        ├── storage.js             (qqTimer 세션 저장/불러오기)
        ├── stats.js               (WCA 절삭 평균 및 통계 계산)
        ├── timer.js               (고정밀 rAF 타이머 & 인스펙션 상태 머신)
        ├── cheatsheet.js          (CFOP 치트시트 모달 & 양손 단축키)
        └── importExport.js        (솔브 텍스트 임포트/익스포트)
```

---

## 4. 실행 및 배포 방법

### 방법 1: 로컬 더블클릭 실행 (`file://`)
- 파일 탐색기에서 `d:\temp\ferdyTemp\qqtimer\index.html`을 더블 클릭하면 브라우저에서 바로 사용 가능합니다.

### 방법 2: GitHub Pages 배포 (gh-pages)
1. GitHub에 새 저장소(예: `qqtimer`) 생성
2. `qqtimer` 폴더 내의 파일들을 git 커밋 및 푸시:
   ```bash
   git init
   git add .
   git commit -m "feat: modernize qqtimer with CFOP cheatsheet and modular architecture"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
3. GitHub 저장소의 **Settings > Pages** 메뉴 이동:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/(root)` 선택 후 **Save**
4. 1~2분 후 `https://<username>.github.io/<repo-name>/` 주소로 전 세계 어디서든 접속 가능합니다!

