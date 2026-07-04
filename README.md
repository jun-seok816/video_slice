# 유튜브 AI 번역기

YouTube URL을 입력하면 영상을 서버에 내려받고, 음성 추출과 AI 자막 번역을 거쳐 현재 Waveform 기반 자막 편집기에서 바로 검수할 수 있도록 확장하는 프로젝트입니다.  
React와 TypeScript 기반 편집 화면에 Express API를 연결하고, `yt-dlp`, `ffmpeg`, AI STT/번역 API를 조합해 `URL 입력 -> 영상 다운로드 -> 자막 생성/번역 -> 편집기 검수` 흐름을 구현합니다.

---

## 시퀀스 다이어그램

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자
    participant FE as 화면(React)
    participant API as 서버(Express)
    participant YTDLP as yt-dlp(유튜브 다운로더)
    participant FFMPEG as ffmpeg(영상/음성 변환 도구)
    participant AI as AI API(STT/번역)
    participant DATA as 저장소(/data/jobs)
    participant Editor as 자막 편집기

    rect rgb(245, 248, 255)
        Note over User,API: 1. 유튜브 URL을 입력해 번역 작업 준비
        User->>FE: 유튜브 URL, 제목, 원본 언어, 번역 언어 입력
        FE->>API: 영상 정보 확인 요청
        API->>YTDLP: 유튜브 영상 기본 정보 조회
        YTDLP-->>API: 제목, 영상 길이, 썸네일 후보 반환
        API-->>FE: 화면에 보여줄 영상 정보 반환
    end

    rect rgb(250, 250, 240)
        Note over FE,DATA: 2. 영상 다운로드 및 번역용 파일 준비
        FE->>API: 영상 다운로드 요청
        API->>DATA: 작업 폴더 생성
        API->>YTDLP: 유튜브 영상을 video.mp4로 다운로드
        API->>FFMPEG: 썸네일 이미지와 음성 파일 생성
        API->>DATA: 영상 정보 파일 저장
        API-->>FE: 작업 ID, 영상 경로, 영상 길이 반환
    end

    rect rgb(245, 255, 248)
        Note over FE,AI: 3. AI로 자막 생성 및 번역
        FE->>API: AI 자막 번역 요청
        API->>AI: 음성 파일을 보내 원문 자막 생성 요청
        AI-->>API: 원문 자막 반환
        API->>AI: 선택한 언어로 번역 요청
        AI-->>API: 번역 자막 반환
        API->>DATA: 원문 자막 파일 저장
        API->>DATA: 번역 자막 파일 저장
        API-->>FE: 번역 완료 상태 반환
    end

    rect rgb(255, 248, 245)
        Note over FE,Editor: 4. 번역 결과를 편집기에서 검수
        FE->>Editor: 해당 작업의 편집 화면으로 이동
        Editor->>DATA: 번역할 영상 로드
        Editor->>DATA: 번역 자막 로드
        User->>Editor: 파형과 자막 구간을 보며 검수 및 수정
    end
```

---

## 시연 영상

AI 영상 번역 기능 구현 후 추가 예정입니다.

---

## 시연 사이트

구현 후 배포 URL 추가 예정입니다.

---

## ERD

```mermaid
erDiagram
    ai_video_jobs ||--o{ ai_subtitle_items : "1:N"
    ai_video_jobs ||--o{ ai_translation_jobs : "1:N"
    ai_translation_jobs ||--o{ ai_subtitle_items : "1:N"

    ai_video_jobs {
        varchar id PK "작업 ID"
        varchar youtube_url "YouTube URL"
        varchar title "영상 제목"
        varchar video_path "다운로드 영상 경로"
        varchar audio_path "추출 오디오 경로"
        varchar thumbnail_path "썸네일 경로"
        int duration "영상 길이"
        varchar source_language "원본 언어"
        varchar target_language "번역 언어"
        enum status "작업 상태"
        datetime created_at "생성 일시"
        datetime updated_at "수정 일시"
    }

    ai_translation_jobs {
        varchar id PK "번역 작업 ID"
        varchar video_job_id FK "영상 작업 ID"
        enum stt_status "STT 상태"
        enum translation_status "번역 상태"
        text error_message "오류 메시지"
        datetime started_at "시작 일시"
        datetime completed_at "완료 일시"
    }

    ai_subtitle_items {
        varchar id PK "자막 ID"
        varchar video_job_id FK "영상 작업 ID"
        varchar translation_job_id FK "번역 작업 ID"
        decimal start_time "시작 시간"
        decimal end_time "종료 시간"
        text source_text "원문 자막"
        text translated_text "번역 자막"
        int sort_order "정렬 순서"
    }
```

---

## 기술 스택

**프론트엔드**

![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=111111)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Webpack](https://img.shields.io/badge/Webpack-8DD6F9?style=for-the-badge&logo=webpack&logoColor=111111)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=ffffff)
![WaveSurfer.js](https://img.shields.io/badge/WaveSurfer.js-2563EB?style=for-the-badge)

**백엔드**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=ffffff)
![Express](https://img.shields.io/badge/Express-111111?style=for-the-badge&logo=express&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=ffffff)

**미디어 처리**

![yt-dlp](https://img.shields.io/badge/yt--dlp-111827?style=for-the-badge)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=ffffff)

**데이터 저장**

![File System](https://img.shields.io/badge/File_System-4B5563?style=for-the-badge)
![JSON](https://img.shields.io/badge/JSON-111111?style=for-the-badge&logo=json&logoColor=ffffff)

**기타**

![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=111111)
![UUID](https://img.shields.io/badge/UUID-4B5563?style=for-the-badge)
![Lodash](https://img.shields.io/badge/Lodash-3492FF?style=for-the-badge&logo=lodash&logoColor=ffffff)

---

## Problem -> Solution -> Impact

- 문제: 자막 Region 1000개 이상에서 스크롤 중 전체 DOM 재생성으로 INP 548 ms, Scripting 80 ms 수준의 체감 지연이 발생했습니다.
- 해결: 가상 스크롤로 뷰포트 주변 30초 버퍼만 생성/유지하고, `lodash/throttle(500 ms)`로 스크롤 이벤트를 제한했습니다. 드래그 중에는 `isUpdating` 플래그로 중복 렌더링을 방지했습니다.
- 결과:

| 지표 | 개선 전 | 개선 후 | 개선율 |
| --- | --- | --- | --- |
| INP | 548 ms | **170 ms** | 약 69% 감소 |
| Script 실행 | 80 ms | **28 ms** | 약 65% 감소 |
| FPS | 30대 | **60 고정** | 약 100% 개선 |

---

## 외부 API/라이브러리 연동 및 주요 인프라 기능

- **yt-dlp(유튜브 다운로더)**: YouTube URL을 받아 영상 정보 확인과 영상 다운로드 처리
- **FFmpeg(영상/음성 변환 도구)**: 다운로드한 영상에서 썸네일 이미지와 음성 파일 추출
- **AI STT API(음성 인식)**: `audio.mp3`를 원문 자막으로 변환
- **AI Translation API(자막 번역)**: 원문 자막을 사용자가 선택한 언어로 번역
- **WaveSurfer.js(파형 기반 편집 도구)**: 오디오 파형, 자막 구간, 타임라인 기반 편집 UI 구성
- **Express Static Data Serving**: `/data/jobs/{jobId}` 하위 영상, 썸네일, 자막 JSON 제공

---

## yt-dlp 서버 설정

서버에서는 시스템 Python에 `pip install -U yt-dlp`를 직접 실행하지 않는 것을 기본값으로 둡니다. Debian/Ubuntu 계열은 특정 정책으로 시스템 Python 환경이 보호될 수 있으므로, 운영 서버에서는 `pipx install yt-dlp` 방식이 권장됩니다.

```bash
pipx install yt-dlp
```

pipx 실행 파일 경로가 PM2 또는 systemd의 `PATH`에 잡히지 않으면 `.env`에 명시합니다.

```env
YTDLP_BIN=/home/joon/.local/bin/yt-dlp
YTDLP_AUTO_UPDATE=false
```

자동 업데이트가 꼭 필요하면 명시적으로 켭니다. 기본 업데이트 방식은 `pipx upgrade yt-dlp`입니다.

```env
YTDLP_AUTO_UPDATE=true
YTDLP_UPDATE_METHOD=pipx
```
