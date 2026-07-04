--   mysql -u root -p < sql/001_create_ai_video_translation_schema.sql

CREATE DATABASE IF NOT EXISTS video_ai_translation
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE video_ai_translation;

CREATE TABLE IF NOT EXISTS ai_video_jobs (
  id VARCHAR(36) NOT NULL COMMENT '작업 ID(UUID)',
  youtube_url VARCHAR(2048) NOT NULL COMMENT 'YouTube URL',
  title VARCHAR(500) NOT NULL COMMENT '영상 제목',
  video_path VARCHAR(1024) NOT NULL COMMENT '다운로드 영상 경로',
  audio_path VARCHAR(1024) NULL COMMENT '추출 오디오 경로',
  thumbnail_path VARCHAR(1024) NULL COMMENT '썸네일 경로',
  duration INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '영상 길이(초)',
  source_language VARCHAR(32) NOT NULL COMMENT '원본 언어 코드',
  target_language VARCHAR(32) NOT NULL COMMENT '번역 언어 코드',
  status ENUM(
    'created',
    'metadata_ready',
    'download_processing',
    'download_ready',
    'translation_processing',
    'completed',
    'failed'
  ) NOT NULL DEFAULT 'created' COMMENT '작업 상태',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
  PRIMARY KEY (id),
  INDEX idx_ai_video_jobs_status_created_at (status, created_at),
  INDEX idx_ai_video_jobs_source_target_language (source_language, target_language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_translation_jobs (
  id VARCHAR(36) NOT NULL COMMENT '번역 작업 ID(UUID)',
  video_job_id VARCHAR(36) NOT NULL COMMENT '영상 작업 ID',
  stt_status ENUM(
    'pending',
    'processing',
    'completed',
    'failed'
  ) NOT NULL DEFAULT 'pending' COMMENT 'STT 상태',
  translation_status ENUM(
    'pending',
    'processing',
    'completed',
    'failed'
  ) NOT NULL DEFAULT 'pending' COMMENT '번역 상태',
  prompt TEXT NULL COMMENT 'STT/번역 참고 프롬프트',
  proper_nouns JSON NULL COMMENT '고유명사 목록',
  error_message TEXT NULL COMMENT '오류 메시지',
  started_at DATETIME NULL COMMENT '시작 일시',
  completed_at DATETIME NULL COMMENT '완료 일시',
  PRIMARY KEY (id),
  INDEX idx_ai_translation_jobs_video_job_id (video_job_id),
  INDEX idx_ai_translation_jobs_status (stt_status, translation_status),
  CONSTRAINT fk_ai_translation_jobs_video_job_id
    FOREIGN KEY (video_job_id)
    REFERENCES ai_video_jobs (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_subtitle_items (
  id VARCHAR(36) NOT NULL COMMENT '자막 ID(UUID)',
  video_job_id VARCHAR(36) NOT NULL COMMENT '영상 작업 ID',
  translation_job_id VARCHAR(36) NOT NULL COMMENT '번역 작업 ID',
  start_time DECIMAL(10,3) NOT NULL COMMENT '시작 시간(초)',
  end_time DECIMAL(10,3) NOT NULL COMMENT '종료 시간(초)',
  source_text TEXT NOT NULL COMMENT '원문 자막',
  translated_text TEXT NULL COMMENT '번역 자막',
  sort_order INT UNSIGNED NOT NULL COMMENT '정렬 순서',
  PRIMARY KEY (id),
  UNIQUE KEY uq_ai_subtitle_items_translation_sort (translation_job_id, sort_order),
  INDEX idx_ai_subtitle_items_video_job_id (video_job_id),
  INDEX idx_ai_subtitle_items_translation_job_id (translation_job_id),
  INDEX idx_ai_subtitle_items_time_range (video_job_id, start_time, end_time),
  CONSTRAINT chk_ai_subtitle_items_time_range
    CHECK (end_time > start_time),
  CONSTRAINT fk_ai_subtitle_items_video_job_id
    FOREIGN KEY (video_job_id)
    REFERENCES ai_video_jobs (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_ai_subtitle_items_translation_job_id
    FOREIGN KEY (translation_job_id)
    REFERENCES ai_translation_jobs (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
