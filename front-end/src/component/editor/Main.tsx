import { Main_editor } from "@jsLib/class/dic_editor/Main_editor";
import { WaveForm } from "@jsLib/class/dic_editor/WaveForm";
import { Main } from "@jsLib/class/Main_class";
import React, { useEffect } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Tooltip } from "react-tooltip";
import "./Main.scss";
import SideBar from "./SideBar";
import TimecodeListView from "./TimecodeListView";
import VideoPlayer from "./VideoPlayer";
import TimeControl from "./TimeControl";

export default function C_Main() {
  const [lv_Obj] = useState(() => {
    return new Main_editor();
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  lv_Obj.im_navigate = useNavigate();

  lv_Obj.im_Prepare_Hooks(async () => {
    window.gm_forceRender = () => {
      lv_Obj.im_forceRender();
    };
    window.gv_canMoveSubtitle = false;
    window.gv_lastCursorY = null;
    window.gv_sw_style = {
      bottom: 60,
    };
    window.gv_fontSize = 15;
    window.gv_waveRange = 50;
  });

  useEffect(() => {
    if (lv_Obj.iv_videoReady) {
      window.gv_videotag = videoRef.current;

      if (window.gv_videotag) {
        window.gv_videotag.addEventListener("pause", window.gm_forceRender);
        window.gv_videotag.addEventListener("play", window.gm_forceRender);
      }
      lv_Obj.pt_Wavesurfer = new WaveForm();
      lv_Obj.pt_Wavesurfer.im_getWaveInfo();
      lv_Obj.pt_Wavesurfer.im_addWaveSurferEvent();
      lv_Obj.im_load_save();
    }

    return () => {
      if (window.gv_videotag) {
        window.gv_videotag.removeEventListener("pause", window.gm_forceRender);
        window.gv_videotag.removeEventListener("play", window.gm_forceRender);
      }
    };
  }, [lv_Obj.iv_videoReady]);

  lv_Obj.im_UnMounted(() => {
    window.gv_videotag?.pause();
    delete window.gv_videotag;
    Main.iv_Swal.close();
  });

  return (
    <section id="dic-editor-page">
      <Tooltip id="dic-editor-page-tooltip" style={{ zIndex: "999999999" }} />
      <div className="Editstyled__Container-sc-1oegqb0-0 irIdhQ">
        <SideBar lv_Obj={lv_Obj} />
        <div className="Editstyled__ContentWrapper-sc-1oegqb0-1 iNhaIq">
          <section className="Editstyled__Viewport-sc-1oegqb0-2 eVpoqR">
            <div className="styles__LeftPanel-sc-1j3a0oh-1 kyptUo">
              <TimecodeListView lv_Obj={lv_Obj} />
            </div>
            <div
              id="main_dic"
              className="Editstyled__PreviewWrapper-sc-1oegqb0-4 gEGicz"
            >
              <VideoPlayer lv_Obj={lv_Obj} videoRef={videoRef} />
            </div>
          </section>
          <div className="FooterControlsstyled__Controls-sc-1jpytqp-0 ezyhkC">
            <TimeControl lv_Obj={lv_Obj} />
            <div id="waveform_timeLine"></div>
            <div id="waveform"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
