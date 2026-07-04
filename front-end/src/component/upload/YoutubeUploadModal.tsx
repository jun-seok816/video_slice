import React from "react";
import "./YoutubeUploadModal.scss";

type YoutubeUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function YoutubeUploadModal(props: YoutubeUploadModalProps) {
  if (!props.isOpen) return null;

  return (
    <div
      className="youtube-upload-modal-backdrop"
      role="presentation"
      onMouseDown={props.onClose}
    >
      <section
        className="youtube-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="youtube-upload-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
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
                placeholder="https://www.youtube.com/watch?v=..."
                aria-label="유튜브 영상 URL"
              />
            </div>
          </label>

          <div className="youtube-upload-modal__meta-grid">
            <label className="youtube-upload-modal__field">
              <span>원본 언어</span>
              <select defaultValue="KOR" aria-label="원본 언어">
                <option value="KOR">한국어</option>
                <option value="ENG">영어</option>
                <option value="JPN">일본어</option>
              </select>
            </label>

            <label className="youtube-upload-modal__field">
              <span>번역 언어</span>
              <select defaultValue="ENG" aria-label="번역 언어">
                <option value="ENG">영어</option>
                <option value="KOR">한국어</option>
                <option value="JPN">일본어</option>
              </select>
            </label>
          </div>
        </div>

        <div className="youtube-upload-modal__actions">
          <button
            type="button"
            className="youtube-upload-modal__secondary"
            onClick={props.onClose}
          >
            취소
          </button>
          <button type="button" className="youtube-upload-modal__primary">
            불러오기
          </button>
        </div>
      </section>
    </div>
  );
}
