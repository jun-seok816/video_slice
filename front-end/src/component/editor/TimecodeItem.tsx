import React, { useEffect, useRef, useState } from "react";
import { WaveForm } from "@jsLib/class/dic_editor/WaveForm";
import { Devide } from "@jsLib/class/dic_editor/Devide";
import { TimeCode } from "@BackEnd/src/class/Timecode";

export interface I_timecode_items {
  pt_Wavesurfer: WaveForm | undefined;
  pt_Devide: Devide;

  im_nextAddButtonClicked(p_timecode: TimeCode): void;
  im_deleteButtonClicked(p_timecode: TimeCode): void;
  im_mergeTimeline(p_timecode: TimeCode, index: number): void;
  im_timeEdited(
    p_e: React.ChangeEvent<HTMLInputElement>,
    p_targetEleName: "sTime" | "eTime",
    p_indexInArray: number,
    p_timecode: TimeCode
  ): void;

  im_forceRender(): void;
}

export default function TimeCodeItem(props: {
  item: TimeCode;
  index: number;
  lv_Obj: I_timecode_items;
}) {
  const sTimeRef = useRef<HTMLInputElement | null>(null);
  const eTimeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (sTimeRef.current)
      sTimeRef.current.value = TimeCode.sm_sec2time(`${props.item.sTime}`);

    if (eTimeRef.current)
      eTimeRef.current.value = TimeCode.sm_sec2time(`${props.item.eTime}`);
  });

  const lv_control = props.lv_Obj.pt_Wavesurfer!.pt_control;

  return (
    <>
      <div
        className=""
        data-block="true"
        data-editor="aub31"
        data-offset-key="qRQGVTxZ8rJ0eHP9AM-AX-0-0"
        style={{ width: "550px" }}
      >
        <div className="jfw498">No. {props.index + 1}</div>
        <div
          data-subtitle-row-uuid="qRQGVTxZ8rJ0eHP9AM-AX"
          className={`${
            lv_control.iv_targetRegion?.id === props.item.id ? "is-focused" : ""
          } DraftJsSubtitleRowstyled__Row-sc-1b40org-2 irqVzR`}
        >
          <div className="on-focus"></div>
          <textarea
            style={{ fontSize: `${window.gv_fontSize}px` }}
            onFocus={() => {
              lv_control.iv_targetRegion = props.item;
              if (window.gv_videotag)
                window.gv_videotag.currentTime = props.item.sTime;

              (window.gv_videotag as any).requestVideoFrameCallback(() => {
                // 프레임 렌더링이 끝난 뒤 실행
                props.lv_Obj.pt_Wavesurfer?.im_updateRegionStyle();
                props.lv_Obj.im_forceRender();
              });
            }}
            onBlur={(e) => {
              lv_control.iv_targetRegion = undefined;
              props.lv_Obj.pt_Wavesurfer?.im_updateRegionStyle();
              props.lv_Obj.im_forceRender();
            }}
            className="timebox_dic_editor"
            onChange={(e) => {
              props.item.text = e.target.value;
              props.lv_Obj.im_forceRender();
            }}
            value={props.item.text}
            name=""
            id={`timebox_txt_${props.index}`}
          ></textarea>
          <div className="DraftJsSubtitleRowstyled__ActionsContainer-sc-1b40org-5 bKXKCV">
            <div
              data-testid="@editor/draft-js-editor/draft-js-row/row-tools"
              className="SubtitleRowControls__Container-sc-jkitdz-0 gLGoUI"
            >
              <div className="SubtitleRowControls__TimeAndCplContainer-sc-jkitdz-1 htxqdP">
                <button
                  id="devide"
                  className="center_button btn_leftside_in_textarea ecXuRN"
                  onClick={() => {
                    props.lv_Obj.pt_Devide.pt_devide.open = true;
                    props.lv_Obj.pt_Devide.im_divideButtonClicked(props.item);
                  }}
                >
                  <i className="bi bi-arrows-expand"></i>
                  <span>나누기</span>
                </button>
                <div
                  data-testid="@editor/subtitle-row/subtitle-time"
                  className="EditTimestyled__FlexContainer-sc-1pygnd9-2 DvGLg"
                >
                  <div className="EditTimestyled__TimeWrapper-sc-1pygnd9-0 fscpTh">
                    <input
                      className="SubtitleTimeInputstyled__StyledSpan-sc-14q3mnw-1 fQPguR"
                      ref={sTimeRef}
                      onChange={(e) => {
                        if (sTimeRef.current)
                          sTimeRef.current.value = e.target.value;
                      }}
                      onBlur={(e) => {
                        props.lv_Obj.im_timeEdited(
                          e,
                          "sTime",
                          props.index,
                          props.item
                        );
                        props.lv_Obj.im_forceRender();
                      }}
                      type="text"
                    ></input>
                  </div>
                  <div className="EditTimestyled__TimeWrapper-sc-1pygnd9-0 fscpTh">
                    <input
                      className="SubtitleTimeInputstyled__StyledSpan-sc-14q3mnw-1 fQPguR"
                      ref={eTimeRef}
                      onChange={(e) => {
                        if (eTimeRef.current)
                          eTimeRef.current.value = e.target.value;
                      }}
                      onBlur={(e) => {
                        props.lv_Obj.im_timeEdited(
                          e,
                          "eTime",
                          props.index,
                          props.item
                        );
                        props.lv_Obj.im_forceRender();
                      }}
                      type="text"
                    ></input>
                  </div>
                </div>
              </div>
              <svg
                onClick={() => {
                  props.lv_Obj.im_deleteButtonClicked(props.item);
                }}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                data-testid="@editor/draft-js-editor/draft-js-row/qRQGVTxZ8rJ0eHP9AM-AX/delete-button"
                className="SubtitleRowControls__DeleteButton-sc-jkitdz-2 jiWEVR"
              >
                <path
                  d="M2 4H3.33333H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M5.3335 4.00016V2.66683C5.3335 2.31321 5.47397 1.97407 5.72402 1.72402C5.97407 1.47397 6.31321 1.3335 6.66683 1.3335H9.3335C9.68712 1.3335 10.0263 1.47397 10.2763 1.72402C10.5264 1.97407 10.6668 2.31321 10.6668 2.66683V4.00016M12.6668 4.00016V13.3335C12.6668 13.6871 12.5264 14.0263 12.2763 14.2763C12.0263 14.5264 11.6871 14.6668 11.3335 14.6668H4.66683C4.31321 14.6668 3.97407 14.5264 3.72402 14.2763C3.47397 14.0263 3.3335 13.6871 3.3335 13.3335V4.00016H12.6668Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  opacity="0.5"
                  d="M6.6665 7.3335V11.3335"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  opacity="0.5"
                  d="M9.3335 7.3335V11.3335"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="SplitAndMergeToolbarstyled__ToolbarContainer-sc-1uslkt8-0 fTcpQP">
          <div className="SplitAndMergeToolbarstyled__ToolbarContainer-sc-1uslkt8-0 fTcpQP">
            <div className="SplitAndMergeToolbarstyled__ToolbarArea-sc-1uslkt8-1 hcjCcX">
              <div className="SplitAndMergeToolbarstyled__Divider-sc-1uslkt8-2 fwQgJA"></div>
              <div className="SplitAndMergeToolbarstyled__ActionsWrapper-sc-1uslkt8-3 lnhbsn">
                {props.index ===
                props.lv_Obj.pt_Wavesurfer!.pt_region.regionList.size - 1 ? (
                  <>
                    <span></span>
                  </>
                ) : (
                  <div
                    onClick={() => {
                      props.lv_Obj.im_mergeTimeline(props.item, props.index);
                    }}
                    className="SplitAndMergeToolbarstyled__ActionButton-sc-1uslkt8-8 iaXMRP"
                  >
                    <div className="SplitAndMergeToolbarstyled__ActionLabel-sc-1uslkt8-4 hXPNrN">
                      타임라인 병합
                    </div>
                    <i className="bi bi-arrow-down-up"></i>
                  </div>
                )}

                <div
                  onClick={() => {
                    props.lv_Obj.im_nextAddButtonClicked(props.item);
                  }}
                  className="SplitAndMergeToolbarstyled__ActionButton-sc-1uslkt8-8 iaXMRP"
                >
                  <div className="SplitAndMergeToolbarstyled__ActionLabel-sc-1uslkt8-4 hXPNrN">
                    타임라인 추가
                  </div>
                  <i className="bi bi-arrow-return-left"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
