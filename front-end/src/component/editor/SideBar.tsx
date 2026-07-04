import { Main_editor } from "@jsLib/class/dic_editor/Main_editor";
import React from "react";

export default function SideBar(props: {
  lv_Obj: Main_editor;
  onYoutubeUploadClick: () => void;
}) {
  return (
    <nav className="styles__Wrapper-sc-1h2t63p-0 kcipEN">
      <button
        type="button"
        className="sidebar-link-button"
        onClick={props.onYoutubeUploadClick}
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="유튜브 영상 불러오기"
        data-tooltip-place="right"
        aria-label="유튜브 영상 불러오기"
      >
        <i className="bi bi-youtube"></i>
        <span>YouTube</span>
      </button>
      <a
        className="sidebar-link-button"
        href="https://github.com/jun-seok816/video_slice"
        target="_blank"
        rel="noopener noreferrer"
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="GitHub 저장소 열기"
        data-tooltip-place="right"
        aria-label="GitHub 저장소 열기"
      >
        <i className="bi bi-github"></i>
        <span>GitHub</span>
      </a>
    </nav>
  );
}
