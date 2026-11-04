# JAL (작가 활동기록)

작품·전시·수상·도록·강의를 한 번 기록하고, 예술활동증명용·미술협회용·장르별 포트폴리오로 골라 PDF로 뽑는 작가용 앱입니다.
휴대폰 홈 화면에 아이콘으로 설치되고, 로그인하면 휴대폰과 컴퓨터에서 같은 기록이 보입니다.

## 작가님이 해 주실 일 (처음 한 번, 30분 정도)

### 1. GitHub: 앱 파일을 올리고 무료로 공개할 곳
1. https://github.com 에서 가입합니다. (이미 계정이 있으면 건너뛰기)
2. 오른쪽 위 **+ → New repository**를 누르고
   - Repository name: `artist-record`
   - **Public** 선택 (무료로 앱 주소를 열려면 공개여야 해요. 기록 내용은 여기 올라가지 않아요.)
   - **Create repository**
3. https://claude.ai/connect-github 에서 GitHub를 Claude에 연결하고, 방금 만든 `artist-record` 저장소에 접근을 허락합니다.
4. 다 되면 Claude에게 "저장소 만들었어"라고 알려 주세요. 파일 올리기와 앱 주소 열기는 Claude가 합니다.

### 2. Supabase: 로그인과 기록·사진을 저장할 곳 (무료 요금제로 시작)
1. https://supabase.com 에서 **Start your project**로 가입합니다. (GitHub 계정으로 가입하면 편해요)
2. **New project**
   - Name: `artist-record`
   - Database Password: 아무거나 길게 정하고 따로 적어 두기
   - Region: **Northeast Asia (Seoul)**
3. 프로젝트가 만들어지면 왼쪽 메뉴 **SQL Editor → New query**를 열고,
   이 폴더의 `supabase/schema.sql` 내용을 통째로 붙여 넣은 뒤 **Run**을 누릅니다. "Success"가 나오면 됩니다.
4. 왼쪽 아래 **Project Settings → API**(또는 Data API)에서 두 가지를 복사해 Claude에게 보내 주세요.
   - **Project URL** (https://xxxx.supabase.co)
   - **anon public** 키 (eyJ로 시작하는 긴 글자)
   - ⚠️ **service_role** 키는 절대 보내지 마세요. 그건 비밀 키예요.

### 3. 앱 주소가 열린 뒤 (Claude가 주소를 알려 드리면)
- Supabase **Authentication → URL Configuration**에서 **Site URL**에 앱 주소를 넣고 저장합니다.
  (가입 확인 메일과 비밀번호 재설정 메일의 링크가 앱으로 돌아오게 하는 설정이에요.)

## 홈 화면에 설치하기
- 아이폰: 사파리로 앱 주소 열기 → 공유 버튼 → **홈 화면에 추가**
- 안드로이드: 크롬으로 앱 주소 열기 → ⋮ → **앱 설치** 또는 **홈 화면에 추가**

## 파일 구성 (참고)
- `index.html`, `styles.css`, `app.js` — 앱 화면
- `config.js` — Supabase 주소와 공개 키 (비어 있으면 이 기기에만 저장하는 체험 모드)
- `manifest.webmanifest`, `sw.js`, `icons/` — 홈 화면 설치용
- `vendor/supabase.js` — Supabase 연결 라이브러리 (v2.45.4)
- `supabase/schema.sql` — 데이터베이스 설정 (본인 기록만 보이도록 잠금 포함)

## 비용
- GitHub Pages: 무료
- Supabase 무료 요금제: 저장 공간 DB 500MB, 사진 1GB. 작가 몇 명이 쓰는 동안은 충분해요.
  사용자가 늘어 구독을 받기 시작하면 Pro(월 25달러)로 올리면 됩니다.
