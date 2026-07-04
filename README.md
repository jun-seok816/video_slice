# 유튜브 AI 번역기

YouTube URL을 입력하면 영상과 음성 인식용 오디오를 서버에 내려받고, AI로 자막을 생성·번역한 뒤 영상과 자막을 함께 보며 바로 검수·수정할 수 있도록 확장한 프로젝트입니다.  
React와 TypeScript 기반 편집 화면에 Express API를 연결하고, `yt-dlp`, ElevenLabs 음성 인식 API, Gemini 번역 API, MySQL을 조합해 `URL 입력 -> 영상/오디오 다운로드 -> 자막 생성 -> 번역 -> 편집기 검수` 흐름을 구현합니다.

---

## 시퀀스 다이어그램

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자
    participant FE as 화면(React)
    participant API as 서버(Express)
    participant YTDLP as yt-dlp(유튜브 다운로더)
    participant Speech as 음성 인식
    participant Gemini as Gemini 번역
    participant DB as MySQL
    participant DATA as 저장소(/data/jobs)
    participant Editor as 자막 편집기

    rect rgb(245, 248, 255)
        Note over User,API: 1. 유튜브 URL을 입력해 다운로드 작업 생성
        User->>FE: 유튜브 URL, 원본 언어, 번역 언어 입력
        FE->>API: /upload/youtube-url 요청
        API->>DATA: data/jobs/{jobId} 폴더 생성
        API->>YTDLP: 프론트 재생용 영상 다운로드
        API->>YTDLP: 자막 생성을 위한 오디오 다운로드
        API->>DB: ai_video_jobs 저장
        API-->>FE: jobId, videoPath, audioPath 반환
    end

    rect rgb(250, 250, 240)
        Note over FE,Speech: 2. 음성 인식으로 원문 자막 생성
        FE->>API: 음성 인식 요청
        API->>DB: ai_translation_jobs 생성
        API->>Speech: 오디오 파일과 원본 언어 코드 전송
        Speech-->>API: 단어별 시간 정보 반환
        API->>DB: ai_subtitle_items 원문 자막 저장
        API-->>FE: translationJobId, 자막 개수 반환
    end

    rect rgb(245, 255, 248)
        Note over FE,Gemini: 3. Gemini로 자막 번역
        FE->>API: /translation/gemini 요청
        API->>DB: 원문 자막 조회
        API->>Gemini: 자막 배치 번역 요청
        Gemini-->>API: 번역 결과 반환
        API->>DB: translated_text 저장 및 작업 완료 처리
        API-->>FE: 번역 완료 상태 반환
    end

    rect rgb(255, 248, 245)
        Note over FE,Editor: 4. 완료된 번역 영상을 편집기에서 검수
        FE->>API: /translation/completed 목록 조회
        FE->>API: /translation/subtitles 자막 조회
        Editor->>DATA: videoPath 영상 로드
        Editor->>API: 번역 자막 기반 TimeCode 로드
        User->>Editor: 파형과 자막 구간을 보며 검수 및 수정
    end
```


## 시연 영상

AI 영상 번역 기능 구현 후 추가 예정입니다.

---

## 시연 사이트

구현 후 배포 URL 추가 예정입니다.

---

## 구현 범위

- YouTube URL을 입력해 서버의 `data/jobs/{jobId}` 폴더에 영상과 음성 인식용 오디오를 저장합니다.
- 다운로드 작업, 음성 인식 작업, 번역 작업, 자막 아이템은 MySQL 테이블에 저장합니다.
- ElevenLabs 음성 인식 응답의 단어별 시간 정보를 자막 구간으로 묶어 저장합니다.
- Gemini API로 저장된 원문 자막을 번역하고, 완료된 작업 목록에서 편집기로 다시 불러옵니다.
- 편집기는 기존 WaveSurfer 기반 자막 타임라인을 재사용하며, 완료 작업 선택 시 영상과 번역 자막을 교체합니다.
- 썸네일은 별도 이미지 파일을 생성하지 않고 YouTube 기본 썸네일 URL을 사용합니다.
- 현재 구현은 ffmpeg로 영상/오디오를 후처리하지 않습니다. yt-dlp 포맷 선택과 병합 기능에 의존합니다.

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
        varchar audio_path "음성 인식용 오디오 경로"
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
        enum stt_status "음성 인식 상태"
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

**데이터 저장**

![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=ffffff)
![File System](https://img.shields.io/badge/File_System-4B5563?style=for-the-badge)

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

- **yt-dlp(유튜브 다운로더)**: YouTube URL을 받아 프론트 재생용 영상과 음성 인식용 오디오 다운로드 처리
- **ElevenLabs 음성 인식 API**: yt-dlp로 받은 오디오 파일을 원문 자막으로 변환
- **Gemini Translation API(자막 번역)**: 원문 자막을 사용자가 선택한 언어로 번역
- **MySQL 작업 저장소**: 영상 작업, 음성 인식/번역 작업, 자막 구간과 번역문 저장
- **WaveSurfer.js(파형 기반 편집 도구)**: 오디오 파형, 자막 구간, 타임라인 기반 편집 UI 구성
- **Express Static Data Serving**: `/data/jobs/{jobId}` 하위 다운로드 영상과 오디오 파일 제공

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
