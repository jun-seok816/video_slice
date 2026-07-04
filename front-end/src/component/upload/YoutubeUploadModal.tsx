import axios from "axios";
import React, { FormEvent, useState } from "react";
import "./YoutubeUploadModal.scss";

type YoutubeUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
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
    subtitleCount?: number;
  };
};

export default function YoutubeUploadModal(props: YoutubeUploadModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("KOR");
  const [targetLanguage, setTargetLanguage] = useState("ENG");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  if (!props.isOpen) return null;

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

      setMessage("영상 다운로드가 완료되었습니다. 음성 인식(STT)을 진행하는 중입니다.");

      const sttResponse = await axios.post<SttResponse>("/stt/elevenlabs", {
        jobId,
      });

      if (sttResponse.data?.err) {
        throw Error(
          sttResponse.data.message || "음성 인식(STT)에 실패했습니다."
        );
      }

      const subtitleCount = sttResponse.data?.data?.subtitleCount;
      setMessage(
        typeof subtitleCount === "number"
          ? `영상 다운로드와 음성 인식이 완료되었습니다. 생성된 자막: ${subtitleCount}개`
          : "영상 다운로드와 음성 인식이 완료되었습니다."
      );
    } catch (err) {
      const fallbackMessage = "YouTube 영상 처리에 실패했습니다.";

      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || fallbackMessage);
      } else if (err instanceof Error) {
        setMessage(err.message || fallbackMessage);
      } else {
        setMessage(fallbackMessage);
      }
    } finally {
      setIsSubmitting(false);
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
