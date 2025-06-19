import { Main_editor } from "@jsLib/class/dic_editor/Main_editor";
import React from "react";

export default function VideoPlayer(props: {
  lv_Obj: Main_editor;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
}) {
  return (
    <div
      id="main_dic"
      className="Editstyled__PreviewWrapper-sc-1oegqb0-4 gEGicz"
    >
      <div className="video_wrap">
        <video
          onLoadedMetadata={() => {
            props.lv_Obj.iv_videoReady = true;
            props.lv_Obj.im_forceRender();
          }}
          ref={props.videoRef}
          src={`${window.origin}/data/J1R0WvHh7muKBWspTSnT1VKTn6Qo6J_21.mp4`}
          id="main_video"
          controls={false}
          style={{ width: "100vh", margin: "0 auto", maxHeight: "600px" }}
        ></video>
        <div
          className="subtitle_wrap"
          id="subtitle_wrap"
          style={{
            bottom: window.gv_sw_style ? window.gv_sw_style.bottom : 60,
          }}
        >
          <div className="subtitle_box">
            <div
              onMouseDown={() => {
                window.gv_canMoveSubtitle = true;
                props.lv_Obj.im_forceRender();
              }}
              className="subtitle_position_control"
              id="subtitle_position_control"
            >
              ↕
            </div>
            <span id="subtitle_text" data-id="">
              {props.lv_Obj.pt_Wavesurfer?.pt_control.iv_targetRegion?.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
