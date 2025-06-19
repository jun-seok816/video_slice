import React, { useEffect, useRef, useState } from "react";
import { Main_editor } from "@jsLib/class/dic_editor/Main_editor";
import C_timecode from "./TimecodeItem";
import { FixedSizeList as List } from "react-window";
import { TimeCode } from "@BackEnd/src/class/Timecode";
import TimeCodeItem from "./TimecodeItem";

export default function TimecodeListView(props: { lv_Obj: Main_editor }) {
  const listRef = useRef<any>(null);

  useEffect(() => {
    if (listRef.current && props.lv_Obj.pt_Wavesurfer) {
      props.lv_Obj.pt_Wavesurfer.iv_listRef = listRef.current;
    }
  }, [props.lv_Obj.pt_Wavesurfer?.pt_region.regionList]); // 의존성 배열에 items 추가

  return (
    <>
      <div className="PanelLayoutstyled__Header-sc-1fodsly-2 bMcJTU with-shadow">
        <h3 style={{ fontWeight: "600" }}>타임코드</h3>
      </div>

      <div id="subtitle_list">
        <List
          ref={listRef}
          height={500}
          className="window-scroll-list"
          itemCount={
            props.lv_Obj.pt_Wavesurfer
              ? props.lv_Obj.pt_Wavesurfer.pt_region.regionList.size
              : 0
          }
          itemSize={121}
          width={500}
          itemData={{
            lv_Obj: props.lv_Obj,
            regionList: props.lv_Obj.pt_Wavesurfer?.pt_region.regionList,
          }}
        >
          {Row}
        </List>
        <div
          id="add_new_timeLine"
          data-testid="@editor/subtitles/subtitles-editor/add-new-subtitle-item"
          className="AddNewSubtitleItemstyled__Container-sc-1tg1fzk-2 cZQiOD"
          onClick={() => {
            props.lv_Obj.pt_Wavesurfer?.im_addTimecode();
            props.lv_Obj.im_forceRender();
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="AddNewSubtitleItemstyled__PlusIconStyled-sc-1tg1fzk-1 HiZep"
          >
            <path
              d="M6 2.5V9.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M2.5 6H9.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span className="AddNewSubtitleItemstyled__Label-sc-1tg1fzk-0 ilvDrO">
            임의의 타임라인 추가
          </span>
        </div>
      </div>
    </>
  );
}

function Row({ data, index, style }: any) {
  const lv_data = data as {
    lv_Obj: Main_editor;
    regionList: Map<string, TimeCode>;
  };
  const values = Array.from(lv_data.regionList.values());
  const item = values[index];
  return (
    <div style={style}>
      <TimeCodeItem
        key={item.id}
        item={item}
        index={index}
        lv_Obj={data.lv_Obj}
      />
    </div>
  );
}
