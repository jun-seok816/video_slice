import { Main_editor } from "@jsLib/class/dic_editor/Main_editor";
import React from "react";

export default function SideBar(props: { lv_Obj: Main_editor }) {
  return (
    <nav className="styles__Wrapper-sc-1h2t63p-0 kcipEN">
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
