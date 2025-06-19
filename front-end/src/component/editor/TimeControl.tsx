import React, { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Main_editor } from "@jsLib/class/dic_editor/Main_editor";
import { TimeCode } from "@BackEnd/src/class/Timecode";

export default function TimeControl(props: { lv_Obj: Main_editor }) {
  if (!window.gv_videotag) return <></>;

  return (
    <div id="time_control">
      <section className="flex-item">
        <C_sidic_tool_box lv_Obj={props.lv_Obj}></C_sidic_tool_box>
      </section>
      <section className="flex-item">
        <div
          style={{ display: "flex", gap: "5px", alignItems: "center" }}
          className="l1k2j3s"
        >
          <button
            color="neutral"
            aria-label="Skip Back"
            className="sc-jlZhew eCbPdQ"
            data-tooltip-id="dic-editor-page-tooltip"
            data-tooltip-content={`${15}초 앞으로 이동`}
            data-tooltip-place="top"
            style={{ padding: "5px" }}
            onClick={() => {
              if (props.lv_Obj.pt_Wavesurfer && window.gv_videotag) {
                window.gv_videotag.currentTime -= 15;
                props.lv_Obj.im_forceRender();
              }
            }}
          >
            <div className="sc-cwHptR hsqYAO">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                data-testid="@timeline-controls/skip-back-icon"
                className="sc-aXZVg dxEjLj"
              >
                <path
                  d="M22 18.9597C22 19.3789 21.515 19.612 21.1877 19.3501L12.488 12.3904C12.2378 12.1903 12.2378 11.8097 12.488 11.6096L21.1877 4.64988C21.515 4.38797 22 4.62106 22 5.04031V18.9597Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M12 18.9597C12 19.3789 11.515 19.612 11.1877 19.3501L2.48804 12.3904C2.23784 12.1903 2.23784 11.8097 2.48804 11.6096L11.1877 4.64988C11.515 4.38797 12 4.62106 12 5.04031V18.9597Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </button>
          <button
            color="neutral"
            className="sc-jlZhew cmYXNA eCbPdQ"
            onClick={props.lv_Obj.im_playPause}
          >
            <div className="sc-cwHptR hsqYAO">
              {!window.gv_videotag.paused ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  color="#292A2E"
                  data-testid="@timeline-controls/play-button-pause-icon"
                  className="sc-aXZVg eBHNib"
                >
                  <rect
                    x="5"
                    y="2.54544"
                    width="4.72727"
                    height="18.9091"
                    rx="2.36364"
                    fill="currentColor"
                  ></rect>
                  <rect
                    x="13.2727"
                    y="2.54544"
                    width="4.72727"
                    height="18.9091"
                    rx="2.36364"
                    fill="currentColor"
                  ></rect>
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  color="#292A2E"
                  data-testid="@timeline-controls/play-button-play-icon"
                  className="sc-aXZVg eBHNib"
                >
                  <path
                    d="M20.0863 13.7705L14.0423 17.6715C13.9947 17.6715 13.9947 17.7249 13.9471 17.7249L7.90304 21.6259C7.6175 21.8397 7.23677 22 6.85604 22C5.85664 22 5 21.0915 5 19.9159V12.007V4.04465C5 3.67058 5.09518 3.34994 5.23795 3.02931C5.76145 2.06742 6.85604 1.69335 7.76027 2.28117L13.8995 6.23563L19.9911 10.1901C20.2766 10.3504 20.5146 10.6176 20.705 10.9382C21.2761 11.9536 20.9905 13.2361 20.0863 13.7705Z"
                    fill="currentColor"
                  ></path>
                </svg>
              )}
            </div>
          </button>
          <button
            color="neutral"
            data-tooltip-id="dic-editor-page-tooltip"
            data-tooltip-content={`${15}초 뒤로 이동`}
            data-tooltip-place="top"
            aria-label="Skip Forward"
            className="sc-jlZhew eCbPdQ"
            style={{ padding: "5px" }}
            onClick={() => {
              if (props.lv_Obj.pt_Wavesurfer && window.gv_videotag) {
                window.gv_videotag.currentTime += 15;
                props.lv_Obj.im_forceRender();
              }
            }}
          >
            <div className="sc-cwHptR hsqYAO">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="sc-aXZVg dxEjLj"
              >
                <path
                  d="M2 5.04031C2 4.62106 2.48497 4.38797 2.81235 4.64988L11.512 11.6096C11.7622 11.8097 11.7622 12.1903 11.512 12.3904L2.81235 19.3501C2.48497 19.612 2 19.3789 2 18.9597L2 5.04031Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M12 5.04031C12 4.62106 12.485 4.38797 12.8123 4.64988L21.512 11.6096C21.7622 11.8097 21.7622 12.1903 21.512 12.3904L12.8123 19.3501C12.485 19.612 12 19.3789 12 18.9597L12 5.04031Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </button>
          <section
            style={{ marginLeft: "0.5em" }}
            className="d-flex flex-column"
          >
            {/* <C_volume lv_Obj={props.lv_Obj}></C_volume> */}
            <C_video_info_wrapper lv_Obj={props.lv_Obj}></C_video_info_wrapper>
          </section>
        </div>
      </section>

      <section className="" style={{ flex: "1 1 3%" }}>
        <div id="zoom_control">
          <div id="zoom_icon">
            <i className=" bi bi-zoom-out"></i>
            <C_range lv_Obj={props.lv_Obj}></C_range>
            <i className=" bi bi-zoom-in"></i>
          </div>
          <p
            style={{ cursor: "pointer" }}
            onClick={() => {
              window.gv_waveRange = 50;
              props.lv_Obj.pt_Wavesurfer?.pt_wavesurfer.zoom(
                window.gv_waveRange
              );
              props.lv_Obj.im_forceRender();
            }}
          >
            Fit
          </p>
        </div>
      </section>
    </div>
  );
}

function C_video_info_wrapper(props: { lv_Obj: Main_editor }) {
  if (!window.gv_videotag) return <></>;
  const [, sub_render] = useState({});

  useEffect(() => {
    if (!window.gv_videotag) return;
    window.gv_videotag.addEventListener("timeupdate", () => {
      sub_render({});
    });
  }, [window.gv_videotag]);

  return (
    <>
      <div className="video_info_wrapper">
        {" "}
        <span id="video_current_time" className="time-lwkj1">
          {props.lv_Obj.pt_Wavesurfer
            ? TimeCode.sm_sec2time(`${window.gv_videotag.currentTime}`)
            : "00:00:00.000"}
        </span>
        <p style={{ color: "#8080804a" }}>/</p>
        <span id="video_total_time" className="time-lwkj1">
          {props.lv_Obj.pt_Wavesurfer
            ? TimeCode.sm_formatDuration(window.gv_videotag)
            : "00:00:00.000"}
        </span>
      </div>
      {/* <C_volume lv_Obj={props.lv_Obj}></C_volume> */}
    </>
  );
}

function C_range(props: { lv_Obj: Main_editor }) {
  const [, sub_render] = useState({});

  return (
    <Form.Range
      value={window.gv_waveRange}
      onChange={(e) => {
        window.gv_waveRange = Number(e.target.value);
        props.lv_Obj.pt_Wavesurfer?.pt_wavesurfer.zoom(window.gv_waveRange);
        sub_render({});
      }}
    />
  );
}

function C_sidic_tool_box(props: { lv_Obj: Main_editor }) {
  return (
    <div
      className="d-flex aligin-items-center timeline_tool_box"
      id="timeline_tool_box"
    >
      <div
        id="makingStartButton"
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="임의 길이의 박스 생성"
        data-tooltip-place="top"
        onMouseUp={() => {
          props.lv_Obj.pt_Wavesurfer?.im_makingStartButtonKeyUp();
          props.lv_Obj.im_forceRender();
        }}
        onMouseDown={() => {
          props.lv_Obj.pt_Wavesurfer?.im_makingStartButtonKeydown();
          props.lv_Obj.im_forceRender();
        }}
        className="circle-wrapper"
      >
        <div className="warning circle"></div>
        <div className="icon">
          <i className="bi bi-hand-index-thumb-fill"></i>
        </div>
      </div>

      <button
        id="findCusornffs23sdf"
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="현재 커서의 위치 찾기"
        data-tooltip-place="top"
        onClick={() => {
          props.lv_Obj.pt_Wavesurfer?.im_findCursor();
          props.lv_Obj.im_forceRender();
        }}
        className="sc-fUnMCh sc-hzhJZQ ldMDzj eyKKz HeaderButton__StyledButton-sc-18cnwzm-0 kBJKpY"
      >
        <i className="bi bi-search"></i>
      </button>

      <button
        id="wordChangenmff132"
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="모든 단어 변경"
        data-tooltip-place="top"
        onClick={() => {
          props.lv_Obj.im_changeWords();
        }}
        className="sc-fUnMCh sc-hzhJZQ ldMDzj eyKKz HeaderButton__StyledButton-sc-18cnwzm-0 kBJKpY"
      >
        <i className="bi bi-arrow-left-right"></i>
      </button>

      <button
        id="timepullpush"
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="다중 타임라인 시간 변경"
        data-tooltip-place="top"
        onClick={() => {
          props.lv_Obj.im_changeTimes();
        }}
        className="sc-fUnMCh sc-hzhJZQ ldMDzj eyKKz HeaderButton__StyledButton-sc-18cnwzm-0 kBJKpY"
      >
        <i className="bi bi-clock-history"></i>
      </button>

      <button
        id="cusorHold"
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="커서를 가운데에 고정"
        data-tooltip-place="top"
        onClick={() => {
          props.lv_Obj.pt_Wavesurfer?.im_fixCursor();
          props.lv_Obj.im_forceRender();
        }}
        className={`sc-fUnMCh sc-hzhJZQ ldMDzj eyKKz HeaderButton__StyledButton-sc-18cnwzm-0 kBJKpY ${
          props.lv_Obj.pt_Wavesurfer?.pt_control.iv_cursor.fix
            ? "kBJKpY-set"
            : ""
        }`}
      >
        <i className="bi bi-input-cursor"></i>
      </button>

      <button
        id="autoscroll_timecode"
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="좌측 타임코드 영역 자동 스크롤"
        data-tooltip-place="top"
        onClick={() => {
          let control = props.lv_Obj.pt_Wavesurfer!.pt_control;
          control.iv_fixSequenceBtn = !control.iv_fixSequenceBtn;
          props.lv_Obj.im_forceRender();
        }}
        className={`sc-fUnMCh sc-hzhJZQ ldMDzj eyKKz HeaderButton__StyledButton-sc-18cnwzm-0 kBJKpY ${
          props.lv_Obj.pt_Wavesurfer?.pt_control.iv_fixSequenceBtn
            ? "kBJKpY-set"
            : ""
        }`}
      >
        <i className="bi bi-align-start"></i>
      </button>

      <button
        id="remove_timecodes"
        data-tooltip-id="dic-editor-page-tooltip"
        data-tooltip-content="다중 타임라인 삭제하기"
        data-tooltip-place="top"
        onClick={() => {
          props.lv_Obj.im_deleteTimelines();
        }}
        className="sc-fUnMCh sc-hzhJZQ ldMDzj eyKKz HeaderButton__StyledButton-sc-18cnwzm-0 kBJKpY delete_btn"
      >
        <i className="bi bi-trash"></i>
      </button>
    </div>
  );
}


