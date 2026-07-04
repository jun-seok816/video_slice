import { TimeCode } from "@BackEnd/src/class/Timecode";
import axios from "axios";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import "./YoutubeUploadModal.scss";

type YoutubeUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onVideoSelected: (payload: {
    videoSrc: string;
    subtitles: TimeCode[];
  }) => void;
};

type YoutubeUploadResponse = {
  err?: boolean;
  message?: string;
  data?: {
    jobId?: string;
    videoPath?: string;
  };
};

type SttResponse = {
  err?: boolean;
  message?: string;
  data?: {
    translationJobId?: string;
    subtitleCount?: number;
  };
};

type TranslationResponse = {
  err?: boolean;
  message?: string;
  data?: {
    translatedCount?: number;
  };
};

type CompletedJob = {
  translationJobId: string;
  jobId: string;
  youtubeUrl: string;
  title: string;
  videoPath: string;
  thumbnailUrl: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  subtitleCount: number;
  createdAt: string;
  completedAt: string | null;
};

type CompletedJobsResponse = {
  err?: boolean;
  message?: string;
  data?: {
    items?: CompletedJob[];
  };
};

type SubtitleResponseItem = {
  id: string;
  text: string;
  sTime: number;
  eTime: number;
};

export default function YoutubeUploadModal(props: YoutubeUploadModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("KOR");
  const [targetLanguage, setTargetLanguage] = useState("ENG");
  const [uploadDate, setUploadDate] = useState("");
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!props.isOpen) return;

    fetchCompletedJobs();
  }, [props.isOpen]);

  const filteredCompletedJobs = useMemo(() => {
    if (!uploadDate) return completedJobs;

    return completedJobs.filter(
      (job) => getDateInputValue(job.createdAt) === uploadDate
    );
  }, [completedJobs, uploadDate]);

  if (!props.isOpen) return null;

  async function fetchCompletedJobs() {
    setIsListLoading(true);

    try {
      const response = await axios.get<CompletedJobsResponse>(
        "/translation/completed",
        {
          params: {
            limit: 100,
          },
        }
      );

      if (response.data?.err) {
        throw Error(
          response.data.message || "완료된 번역 작업 목록을 불러오지 못했습니다."
        );
      }

      setCompletedJobs(response.data?.data?.items || []);
    } catch (err) {
      setMessage(getErrorMessage(err, "완료된 번역 작업 목록을 불러오지 못했습니다."));
    } finally {
      setIsListLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("YouTube 영상을 다운로드하는 중입니다.");

    try {
      const uploadResponse = await axios.post<YoutubeUploadResponse>(
        "/upload/youtube-url",
        {
          youtubeUrl,
          sourceLanguage,
          targetLanguage,
        }
      );

      if (uploadResponse.data?.err) {
        throw Error(
          uploadResponse.data.message || "YouTube 영상 다운로드에 실패했습니다."
        );
      }

      const jobId = uploadResponse.data?.data?.jobId;

      if (!jobId) {
        throw Error("STT를 수행할 작업 ID를 받지 못했습니다.");
      }

      setMessage("영상 다운로드가 완료되었습니다. 음성 인식을 진행하는 중입니다.");

      const sttResponse = await axios.post<SttResponse>("/stt/elevenlabs", {
        jobId,
      });

      if (sttResponse.data?.err) {
        throw Error(sttResponse.data.message || "음성 인식에 실패했습니다.");
      }

      const translationJobId = sttResponse.data?.data?.translationJobId;

      if (!translationJobId) {
        throw Error("번역을 수행할 작업 ID를 받지 못했습니다.");
      }

      const subtitleCount = sttResponse.data?.data?.subtitleCount;
      setMessage(
        typeof subtitleCount === "number"
          ? `음성 인식이 완료되었습니다. 생성된 자막 ${subtitleCount}개를 번역하는 중입니다.`
          : "음성 인식이 완료되었습니다. 자막을 번역하는 중입니다."
      );

      const translationResponse = await axios.post<TranslationResponse>(
        "/translation/gemini",
        {
          translationJobId,
        }
      );

      if (translationResponse.data?.err) {
        throw Error(translationResponse.data.message || "자막 번역에 실패했습니다.");
      }

      const translatedCount = translationResponse.data?.data?.translatedCount;
      setMessage(
        typeof translatedCount === "number"
          ? `영상 처리와 번역이 완료되었습니다. 번역된 자막: ${translatedCount}개`
          : "영상 처리와 번역이 완료되었습니다."
      );
      setYoutubeUrl("");
      await fetchCompletedJobs();
    } catch (err) {
      setMessage(getErrorMessage(err, "YouTube 영상 처리에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompletedJobClick(job: CompletedJob) {
    if (selectedJobId === job.translationJobId) return;

    setSelectedJobId(job.translationJobId);
    setMessage("선택한 영상의 자막을 불러오는 중입니다.");

    try {
      const response = await axios.get<SubtitleResponseItem[]>(
        "/translation/subtitles",
        {
          params: {
            translationJobId: job.translationJobId,
          },
        }
      );

      if (!Array.isArray(response.data)) {
        throw Error("자막 응답 형식이 올바르지 않습니다.");
      }

      const subtitles = response.data.map(
        (item) => new TimeCode(item.text, Number(item.sTime), Number(item.eTime), item.id)
      );

      props.onVideoSelected({
        videoSrc: toDataUrl(job.videoPath),
        subtitles,
      });
    } catch (err) {
      setMessage(getErrorMessage(err, "선택한 영상의 자막을 불러오지 못했습니다."));
      setSelectedJobId("");
    }
  }

  return (
    <div
      className="youtube-upload-modal-backdrop"
      role="presentation"
      onMouseDown={props.onClose}
    >
      <form
        className="youtube-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="youtube-upload-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="youtube-upload-modal__header">
          <div>
            <span className="youtube-upload-modal__eyebrow">YouTube URL</span>
            <h2 id="youtube-upload-modal-title">유튜브 영상 불러오기</h2>
          </div>
          <button
            type="button"
            className="youtube-upload-modal__icon-button"
            onClick={props.onClose}
            aria-label="닫기"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="youtube-upload-modal__body">
          <section className="youtube-upload-modal__completed">
            <div className="youtube-upload-modal__section-header">
              <div>
                <h3>완료된 번역 영상</h3>
                <span>{filteredCompletedJobs.length}개</span>
              </div>
              <button
                type="button"
                className="youtube-upload-modal__refresh"
                onClick={fetchCompletedJobs}
                disabled={isListLoading}
                aria-label="목록 새로고침"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>

            <label className="youtube-upload-modal__field">
              <span>업로드 날짜</span>
              <input
                type="date"
                value={uploadDate}
                onChange={(event) => setUploadDate(event.target.value)}
              />
            </label>

            <div className="youtube-upload-modal__list">
              {isListLoading && (
                <p className="youtube-upload-modal__empty">목록을 불러오는 중입니다.</p>
              )}

              {!isListLoading && filteredCompletedJobs.length === 0 && (
                <p className="youtube-upload-modal__empty">
                  선택한 날짜에 완료된 영상이 없습니다.
                </p>
              )}

              {!isListLoading &&
                filteredCompletedJobs.map((job) => (
                  <button
                    key={job.translationJobId}
                    type="button"
                    className="youtube-upload-modal__list-item"
                    onClick={() => handleCompletedJobClick(job)}
                    disabled={selectedJobId === job.translationJobId}
                  >
                    {job.thumbnailUrl && (
                      <img src={job.thumbnailUrl} alt="" loading="lazy" />
                    )}
                    <span>
                      <strong>{job.title || "제목 없음"}</strong>
                      <small>
                        {getDateLabel(job.createdAt)} · 자막 {job.subtitleCount}개 ·{" "}
                        {job.sourceLanguage} → {job.targetLanguage}
                      </small>
                    </span>
                  </button>
                ))}
            </div>
          </section>

          <div className="youtube-upload-modal__divider"></div>

          <label className="youtube-upload-modal__field">
            <span>영상 URL</span>
            <div className="youtube-upload-modal__input-row">
              <i className="bi bi-youtube"></i>
              <input
                type="url"
                value={youtubeUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                aria-label="유튜브 영상 URL"
                onChange={(event) => setYoutubeUrl(event.target.value)}
              />
            </div>
          </label>

          <div className="youtube-upload-modal__meta-grid">
            <label className="youtube-upload-modal__field">
              <span>원본 언어</span>
              <select
                value={sourceLanguage}
                aria-label="원본 언어"
                onChange={(event) => setSourceLanguage(event.target.value)}
              >
                <option value="KOR">한국어</option>
                <option value="ENG">영어</option>
                <option value="JPN">일본어</option>
              </select>
            </label>

            <label className="youtube-upload-modal__field">
              <span>번역 언어</span>
              <select
                value={targetLanguage}
                aria-label="번역 언어"
                onChange={(event) => setTargetLanguage(event.target.value)}
              >
                <option value="ENG">영어</option>
                <option value="KOR">한국어</option>
                <option value="JPN">일본어</option>
              </select>
            </label>
          </div>
        </div>

        {message.length > 0 && (
          <p className="youtube-upload-modal__message">{message}</p>
        )}

        <div className="youtube-upload-modal__actions">
          <button
            type="button"
            className="youtube-upload-modal__secondary"
            onClick={props.onClose}
          >
            취소
          </button>
          <button
            type="submit"
            className="youtube-upload-modal__primary"
            disabled={isSubmitting || youtubeUrl.trim().length === 0}
          >
            {isSubmitting ? "처리 중" : "불러오기"}
          </button>
        </div>
      </form>
    </div>
  );
}

function toDataUrl(filePath: string) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const dataIndex = normalizedPath.lastIndexOf("/data/");

  if (normalizedPath.startsWith("http")) return normalizedPath;
  if (normalizedPath.startsWith("/data/")) return `${window.origin}${normalizedPath}`;
  if (dataIndex >= 0) return `${window.origin}${normalizedPath.slice(dataIndex)}`;

  return normalizedPath;
}

function getDateInputValue(value: string) {
  const matched = value.match(/\d{4}-\d{2}-\d{2}/);
  return matched?.[0] || "";
}

function getDateLabel(value: string) {
  const dateValue = getDateInputValue(value);
  return dateValue || "날짜 없음";
}

function getErrorMessage(err: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(err)) {
    const responseMessage = err.response?.data?.message;
    return typeof responseMessage === "string" ? responseMessage : fallbackMessage;
  }

  if (err instanceof Error) {
    return err.message || fallbackMessage;
  }

  return fallbackMessage;
}
