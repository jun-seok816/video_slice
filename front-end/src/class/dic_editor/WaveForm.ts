import { Timeline_module } from "./TimeLine_module";
import { TimeCode } from "@BackEnd/src/class/Timecode";
import { Region } from "@jsLib/types/wavesurfer";
import { Main } from "@jsLib/class/Main_class";
import "./WaveForm.scss";
import { throttle } from "lodash";

export type t_region_save = {
  beforeRegion: Region | undefined;
  nextRegion: Region | undefined;
  regionList: Map<string, TimeCode>;
  isBeingCreatedEndTime: number;
  isBeingCreatedId: string | undefined;
  isBeingCreatedNextRegionStartTime: number;
  isBeingCreatedStartTime: number;
  sequenceIsBeingCreated: boolean;
};

export type t_control = {
  iv_cursor: {
    fix: boolean;
  };
  iv_fixSequenceBtn: boolean;
  iv_targetRegion: TimeCode | undefined;
  iv_fontSize: number;
};

export class WaveForm {
  private iv_wavesurfer: any;
  private iv_TimeLine: Timeline_module = new Timeline_module();
  private iv_region: t_region_save;
  private iv_control: t_control;
  public iv_listRef: any;
  private isUpdating = false;

  private visibleRegionInstances = new Map<string, Region>();
  constructor() {
    this.iv_wavesurfer =
      //@ts-ignore
      WaveSurfer.create({
        container: "#waveform",
        waveColor: "grey",
        progressColor: "#DFD0BB",
        backend: "MediaElement",
        cursorColor: "#ee5050",
        height: 70,
        autoCenter: false,
        cursorWidth: 3,
        plugins: [
          //@ts-ignore
          WaveSurfer.regions.create({}),
          //@ts-ignore
          WaveSurfer.timeline.create({
            container: "#waveform_timeLine",
            formatTimeCallback: this.iv_TimeLine.formatTimeCallback,
            timeInterval: this.iv_TimeLine.timeInterval,
            primaryLabelInterval: this.iv_TimeLine.primaryLabelInterval,
            secondaryLabelInterval:
              this.iv_TimeLine.secondaryLabelInterval.bind(this.iv_TimeLine),
            primaryColor: "#656565",
            secondaryColor: "#656565",
            primaryFontColor: "#656565",
            secondaryFontColor: "#656565",
            normalize: true,
          }),
          //@ts-ignore
          WaveSurfer.cursor.create({
            showTime: true,
            opacity: 1,
            responsive: true,
            customShowTimeStyle: {
              "background-color": "rgba(50,50,50,0.9)",
              color: "#fff",
              padding: "1px",
              "font-size": "14px",
              "margin-top": "0px",
            },
          }),
        ],
      });

    this.iv_region = {
      beforeRegion: undefined,
      nextRegion: undefined,
      regionList: new Map(),
      isBeingCreatedEndTime: 0,
      isBeingCreatedId: undefined,
      isBeingCreatedNextRegionStartTime: 9999999999,
      isBeingCreatedStartTime: 0,
      sequenceIsBeingCreated: false,
    };

    // 1) zoom 과 scroll 에 updateVisibleRegions 바인딩
    const throttledUpdate = throttle(this.updateVisibleRegions, 500);
    this.iv_wavesurfer.on("zoom", throttledUpdate);
    const wrapper = this.iv_wavesurfer.drawer.wrapper as HTMLElement;    
    wrapper.addEventListener("scroll", throttledUpdate);

    this.iv_listRef = undefined;

    this.iv_control = {
      iv_cursor: {
        fix: false,
      },
      iv_fixSequenceBtn: false,
      iv_targetRegion: undefined,
      iv_fontSize: 15,
    };
  }

  public get pt_wavesurfer(): any {
    return this.iv_wavesurfer;
  }

  public get pt_control(): t_control {
    return this.iv_control;
  }

  public get pt_region(): t_region_save {
    return this.iv_region;
  }

  public im_resetAll() {
    this.iv_region.regionList.clear();
    this.iv_wavesurfer.regions.clear();
  }

  public im_sortingByRegionListData() {
    const sortedEntries = Array.from(this.iv_region.regionList.entries()) // [ [id, TimeCode], … ]
      .sort(([, a], [, b]) => a.sTime - b.sTime); // sTime 기준 정렬

    this.iv_region.regionList = new Map(sortedEntries); // 다시 Map으로 재구성
    this.im_regionCheck();
    this.updateVisibleRegions();
  }
  /** 서버에서 불러온 메타데이터를 교체하고 화면 렌더 */
  public setRegionsData(regions: typeof this.iv_region.regionList) {
    console.log(
      "[setRegionsData] 기존 visibleRegionInstances 개수:",
      this.visibleRegionInstances.size
    );
    // 1) 기존에 그려진 것들 제거
    for (const [id, region] of this.visibleRegionInstances.entries()) {
      console.log(`[setRegionsData] remove region id=${id}`);
      region.remove();
    }
    this.visibleRegionInstances.clear();

    // 2) 전체 데이터 갱신 & 렌더
    this.iv_region.regionList = regions;
    console.log("[setRegionsData] 전체 regionsData 개수:", regions.size);
    this.im_sortingByRegionListData();
  }

  /** 화면에 보이는 시간 범위 계산 */
  private getVisibleTimeRange() {
    const params = this.iv_wavesurfer.params as any;
    const pxPerSec = params.minPxPerSec as number;
    const wrapper = this.iv_wavesurfer.drawer.wrapper as HTMLElement;
    const scrollLeft = wrapper.scrollLeft;
    const width = wrapper.clientWidth;

    const start = scrollLeft / pxPerSec;
    const end = (scrollLeft + width) / pxPerSec;
    console.log(
      `[getVisibleTimeRange] start=${start.toFixed(2)}, end=${end.toFixed(2)}`
    );
    return { start, end };
  }

  /** 보이는 Region만 add/remove */
  private updateVisibleRegions = () => {
    if (this.isUpdating) return;
    const RENDER_BUFFER_SEC = 30; // 필요에 맞게 숫자 조정
    // 1) 플러그인이 준비됐는지 확인
    const regPlugin = this.iv_wavesurfer.regions;
    if (!regPlugin) return;

    // 2) 내부 리스트와 visible map 전부 초기화
    regPlugin.clear();
    this.visibleRegionInstances.forEach((inst) => inst.remove());
    this.visibleRegionInstances.clear();

    // 3) Map의 region을 겹치지 않게 "초기화"
    const sortedRegions = Array.from(this.iv_region.regionList.values()).sort(
      (a, b) => a.sTime - b.sTime
    );

    let prevRegion: (typeof sortedRegions)[0] | null = null;
    for (const region of sortedRegions) {
      if (prevRegion && region.sTime < prevRegion.eTime) {
        region.sTime = prevRegion.eTime;
        if (region.eTime < region.sTime) {
          region.eTime = region.sTime;
        }
      }
      prevRegion = region;
    }

    // 4) 보이는 시간 범위 계산
    const { start, end } = this.getVisibleTimeRange();
    const expandedStart = Math.max(0, start - RENDER_BUFFER_SEC);
    const expandedEnd = end + RENDER_BUFFER_SEC;

    // 5) Map 순회하며 조건 만족하는 것만 생성
    this.iv_region.regionList.forEach((tc, id) => {
      if (tc.eTime > expandedStart && tc.sTime < expandedEnd) {
        //console.log('updateVisibleRegions %o',tc);
        const inst = this.im_makeRegion(tc);
        this.visibleRegionInstances.set(id, inst);
      }
    });

    this.im_updateRegionStyle();
  };

  public async im_getWaveInfo() {
    if (!window.gv_videotag) return;
    this.iv_wavesurfer.load(window.gv_videotag);
    if (window.gv_videotag === null) return;
    window.gv_videotag.controls = true;
    this.iv_wavesurfer.zoom(20);
  }

  public im_makeRegion(timecode: TimeCode) {
    // 1) 모델 업데이트
    this.iv_region.regionList.set(timecode.id, timecode);
    return this.iv_wavesurfer.addRegion({
      id: timecode.id,
      start: timecode.sTime,
      end: timecode.eTime,
      loop: false,
      color: "rgba(204, 121, 82, 0.8)",
      minLength: 0.5,
      handleStyle: {
        left: {
          cursor: "col-resize",
          position: "absolute",
          width: "4px",
          maxWidth: "5px",
          backgroundColor: "rgba(244, 131, 52, 1)",
        },
        right: {
          cursor: "col-resize",
          position: "absolute",
          width: "4px",
          maxWidth: "5px",
          backgroundColor: "rgba(244, 131, 52, 1)",
        },
      },
    });
  }

  public im_updateRegionStyle() {
    // (1) 이전에 선택된 Region에서 'selected' 클래스 제거
    const prev = document.querySelector(".wavesurfer-region.selected");
    if (prev) {
      prev.classList.remove("selected");
    }

    // (2) 현재 선택된 Region에만 'selected' 클래스 추가
    if (this.pt_control.iv_targetRegion) {
      const sel = document.querySelector(
        `.wavesurfer-region[data-id="${this.pt_control.iv_targetRegion.id}"]`
      );
      if (sel) {
        sel.classList.add("selected");
      }
    }
  }

  /**
   * @des
   *  wavesurfer 이벤트 연결
   */
  public async im_addWaveSurferEvent() {
    this.iv_wavesurfer.on("audioprocess", () => {
      if (!window.gv_videotag) return;
      if (
        this.iv_region.sequenceIsBeingCreated &&
        this.iv_region.isBeingCreatedId
      ) {
        const lv_ch =
          this.iv_wavesurfer.regions.list[this.iv_region.isBeingCreatedId];
        if (lv_ch === undefined) {
          console.warn(
            "lv_ch undefined: %o, isBeingCreatedId: %o",
            lv_ch,
            this.iv_region.isBeingCreatedId
          );
          // regionList와 regions 모두 예외처리(아무 작업도 안 하고 return)
          return;
        }

        // lv_ch가 undefined가 아니므로, 아래는 안전하게 진행 가능
        const curTime = Number(this.iv_wavesurfer.getCurrentTime().toFixed(3));
        if (curTime > this.iv_region.isBeingCreatedNextRegionStartTime) {
          // 뒤에 있는 시퀀스의 시간을 초과하는경우
          this.iv_region.sequenceIsBeingCreated = false;
          return;
        } else {
          // regions와 regionList 모두 종료시간 동기화
          lv_ch.update({ end: curTime });
          const regionInList = this.iv_region.regionList.get(lv_ch.id);
          if (regionInList) {
            regionInList.eTime = curTime;
          }
        }
      }
    });

    this.iv_wavesurfer.on("region-click", (region: Region) => {
      setTimeout(() => {
        this.iv_wavesurfer.setCurrentTime(region.start - 0.02);
      }, 100);
    });

    this.iv_wavesurfer.on("region-mouseenter", () => {
      this.iv_wavesurfer.cursor.hideCursor();
    });

    this.iv_wavesurfer.on("region-mouseleave", () => {
      this.iv_wavesurfer.cursor.showCursor();
    });

    this.iv_wavesurfer.on("region-updated", (region: Region) => {
      this.isUpdating = true;
      this.im_regionMoveCheck(region);
    });

    this.iv_wavesurfer.on("region-update-end", (region: Region) => {
      this.isUpdating = false;
      this.im_sinkRegionListByWavesurfer(region);
    });

    this.iv_wavesurfer.on("region-created", (region: Region) => {
      if (this.iv_region.isBeingCreatedId) {
        console.log("region-create", region, this.iv_region.isBeingCreatedId);
        region.id === this.iv_region.isBeingCreatedId;
      }
      // 1) 전체 키 배열 얻기
      const keys = Array.from(this.iv_region.regionList.keys());

      // 2) 현재 Region의 인덱스 찾기
      const idx = keys.indexOf(region.id);
      if (idx === -1) return;

      // 3) next/prev ID 추출
      const nextKey = keys[idx + 1];
      const prevKey = keys[idx - 1];

      // 4) nextRegion 설정
      if (nextKey) {
        const nextTimecode = this.iv_region.regionList.get(nextKey)!;
        region.attributes.nextRegion = nextTimecode;
        region.attributes.nextIndex = idx + 1;
      }

      // 5) beforeRegion 설정
      if (prevKey) {
        const prevTimecode = this.iv_region.regionList.get(prevKey)!;
        region.attributes.beforeRegion = prevTimecode;
        region.attributes.beforeIndex = idx - 1;
      }

      // (원래 하던 index 세팅 등은 im_regionCheck에서 처리)
    });

    this.iv_wavesurfer.on("region-in", (region: Region) => {
      // Map에서 바로 꺼내기
      const timecode = this.pt_region.regionList.get(region.id);
      if (!timecode) return; // id 매칭 안 되면 무시

      // 아직 타겟이 비어 있으면 첫 진입 시 할당
      this.pt_control.iv_targetRegion = timecode;

      // 고정 스크롤 모드라면 리스트 스크롤 처리
      if (
        this.pt_control.iv_targetRegion.id === region.id &&
        this.iv_listRef &&
        this.pt_control.iv_fixSequenceBtn
      ) {
        const keys = Array.from(this.pt_region.regionList.keys());
        const idx = keys.indexOf(region.id);
        this.iv_listRef.scrollToItem(idx, "start");
      }

      // 스타일 업데이트
      this.im_updateRegionStyle();
      window.gm_forceRender();
    });

    this.iv_wavesurfer.on("region-out", (region: Region) => {
      if (
        this.pt_control.iv_targetRegion &&
        this.pt_control.iv_targetRegion.id === region.id
      ) {
        this.pt_control.iv_targetRegion = undefined;
        this.im_updateRegionStyle();
        window.gm_forceRender();
      }
    });
  }

  private im_checkTimeDuplicated(sec: number) {
    // 방법 2: values()를 배열로 변환 후 find
    return Array.from(this.iv_region.regionList.values()).find(
      (tc) => tc.sTime <= sec && tc.eTime > sec
    );
  }

  public im_addTimecode(
    sTime: null | number = null,
    eTime: null | number = null,
    reDrawing: boolean = true
  ) {
    // 1) 아무것도 없는 경우 현재 시간에서 1초간 시퀀스를 잡습니다.
    if (!window.gv_videotag) return;

    let check;
    if (sTime === null) {
      sTime = this.iv_wavesurfer.getCurrentTime() || 0;
    }

    if (sTime === null) {
      console.error("sTime is still null after assignment.");
      return;
    }

    // 2) 현재시간이 겹치는지 체크
    check = this.im_checkTimeDuplicated(sTime);

    if (check === undefined) {
      // 안겹친다면 ..  0.5초~1초 사이에 없는지 확인
      const safeSTime: number = sTime;

      // 또는 배열 메서드로 한 줄로 작성
      const near = Array.from(this.iv_region.regionList.values()).find(
        (tc) => tc.sTime > safeSTime
      );
      if (near == undefined) {
        // 가장 맨 뒤에 있는 경우
        if (!eTime) {
          eTime = sTime + 1;
        }
      } else {
        if (near.sTime - sTime < 0.5) {
          Main.im_toast("0.5초 이상의 간격이 필요합니다", "warn");
          return;
        } else if (
          near.sTime - sTime >= 0.5 &&
          near.sTime - sTime <= 1 &&
          !eTime
        ) {
          eTime = near.sTime;
        } else if (near.sTime - sTime > 1 && !eTime) {
          eTime = sTime + 1;
        }
      }
    } else {
      // 겹친다면.
      Main.im_toast("0.5초 이상의 간격이 필요합니다", "warn");
      return;
    }

    if (eTime === null) {
      console.error("eTime is still null after assignment.");
      return;
    }

    if (eTime > window.gv_videotag.duration) {
      Main.im_toast("비디오 길이보다 큽니다", "warn");
      return;
    }

    let timecode = new TimeCode("", sTime, eTime);

    this.im_makeRegion(timecode);
    this.im_sortingByRegionListData();

    return timecode.id;
  }

  /**
   * @des
   *  임의 길이의 시퀀스 생성 start
   */
  public im_makingStartButtonKeydown() {
    if (!window.gv_videotag) return;
    if (window.gv_videotag.paused) {
      Main.im_toast("비디오가 재생 중인 상태에서 사용 가능합니다.", "warn");
      return;
    }
    if (this.iv_region.isBeingCreatedId != null) {
      return;
    }

    let sTime = parseFloat(window.gv_videotag.currentTime.toFixed(3)) * 1;
    const check = this.im_checkTimeDuplicated(sTime);
    if (check !== undefined) {
      Main.im_toast("시작 시간이 다른 타임라인과 겹칩니다.", "error");
      return;
    }
    // 시퀀스 생성 시작 ( 초기 세팅 id, startTime, 상태값)
    this.iv_region.isBeingCreatedId = TimeCode.makeID();
    this.iv_region.isBeingCreatedStartTime = sTime;
    let near = Array.from(this.iv_region.regionList.values()).find(
      (el) => el.sTime > this.iv_region.isBeingCreatedStartTime
    ); // 자신보다 큰 것중에 가장 가까운 것
    if (near !== undefined) {
      this.iv_region.isBeingCreatedNextRegionStartTime = near.sTime;
    } else {
      this.iv_region.isBeingCreatedNextRegionStartTime =
        window.gv_videotag.duration;
    }
    this.iv_region.sequenceIsBeingCreated = true;
    let timecode = new TimeCode(
      "",
      this.iv_region.isBeingCreatedStartTime,
      this.iv_region.isBeingCreatedStartTime + 0.01,
      this.iv_region.isBeingCreatedId
    );
    this.im_makeRegion(timecode);
    this.im_sortingByRegionListData();
    const lv_ch =
      this.iv_wavesurfer.regions.list[this.iv_region.isBeingCreatedId];
    if (lv_ch === undefined) {
      console.warn(
        "lv_ch undefined: %o, isBeingCreatedId: %o",
        lv_ch,
        this.iv_region.isBeingCreatedId
      );
      // regionList와 regions 모두 예외처리(아무 작업도 안 하고 return)
      return;
    }
    //this.updateVisibleRegions();
  }
  /**
   * @des
   *  임의 길의의 시퀀스 생성 end
   */
  public im_makingStartButtonKeyUp() {
    if (!window.gv_videotag) return;
    this.iv_region.sequenceIsBeingCreated = false;
    if (!this.iv_region.isBeingCreatedId) {
      console.error("not found regionID");
      return;
    }
    const lv_ch =
      this.iv_wavesurfer.regions.list[this.iv_region.isBeingCreatedId];
    if (lv_ch === undefined) {
      console.warn(
        "lv_ch undefined: %o, isBeingCreatedId: %o",
        lv_ch,
        this.iv_region.isBeingCreatedId
      );
      // regionList와 regions 모두 예외처리(아무 작업도 안 하고 return)
      return;
    }
    const targetRegion =
      this.iv_wavesurfer.regions.list[this.iv_region.isBeingCreatedId];
    if (targetRegion.end - targetRegion.start < 0.5) {
      Main.im_toast("종료 시간과 0.5초 이상 텀이 있어야 합니다.", "warn");
      this.iv_region.regionList.delete(this.iv_region.isBeingCreatedId);
      targetRegion.remove();
    }    
    this.isUpdating = false;
    this.iv_region.isBeingCreatedStartTime = 0;
    this.iv_region.isBeingCreatedEndTime = 0;
    this.iv_region.isBeingCreatedId = undefined;
    this.iv_region.isBeingCreatedNextRegionStartTime =
      window.gv_videotag.duration;
  }

  private im_sinkRegionListByWavesurfer(region: Region) {
    // 1) Map에서 TimeCode 꺼내기
    const tc = this.iv_region.regionList.get(region.id);
    if (!tc) return;

    // 2) sTime, eTime 업데이트
    tc.sTime = parseFloat(region.start.toFixed(3)) * 1;
    tc.eTime = parseFloat(region.end.toFixed(3)) * 1;

    // 3) index·연결 정보 갱신
    this.im_regionCheck();
  }

  private im_regionCheck() {
    const pluginList = this.iv_wavesurfer.regions.list;
    const ids = Array.from(this.iv_region.regionList.keys());

    ids.forEach((id, idx) => {
      const inst = pluginList[id];
      if (!inst) return; // 화면에 없는 것은 무시

      // index
      inst.attributes.index = idx;

      // next
      const nextId = ids[idx + 1];
      if (nextId) {
        inst.attributes.nextRegion = this.iv_region.regionList.get(nextId);
        inst.attributes.nextIndex = idx + 1;
      }

      // prev
      const prevId = ids[idx - 1];
      if (prevId) {
        inst.attributes.beforeRegion = this.iv_region.regionList.get(prevId);
        inst.attributes.beforeIndex = idx - 1;
      }
    });

    window.gm_forceRender();
  }

  private im_regionMoveCheck(region: Region) {
    const regionMap = this.iv_region.regionList;
    const pluginList = this.iv_wavesurfer.regions.list;
    // 전체 Map 키 배열 확보
    const keys = Array.from(regionMap.keys());
    const idx = keys.indexOf(region.id);
    if (idx === -1) return;

    // 현재 시퀀스 모델 객체
    const currentTC = regionMap.get(region.id)!;

    // (1) 다음 영역 처리
    const nextKey = keys[idx + 1];
    if (nextKey) {
      const nextInst = pluginList[nextKey];
      if (nextInst === undefined) return;
      const nextTC = regionMap.get(nextKey)!;

      // 겹침 확인
      if (region.end > nextTC.sTime) {
        // case1: 다음 영역이 작거나 같다면 내 영역에 붙이기
        if (nextTC.eTime - nextTC.sTime <= 1) {
          if (region.end - region.start <= 1) {
            region.update({
              start: nextTC.sTime - 1,
              end: nextTC.sTime,
            });
          } else {
            region.update({ end: nextTC.sTime });
          }
          // 모델 동기화
          currentTC.eTime = region.end;
        }
        // case2: 다음 영역을 밀기
        else {
          nextInst.update({ start: region.end });
          nextTC.sTime = region.end;
        }
      }
    }

    // (2) 이전 영역 처리
    const prevKey = keys[idx - 1];
    if (prevKey) {
      const prevInst = pluginList[prevKey];
      if (prevInst === undefined) return;
      const prevTC = regionMap.get(prevKey)!;

      if (region.start < prevTC.eTime) {
        // case1: 이전 영역이 작거나 같다면 내 영역에 붙이기
        if (prevTC.eTime - prevTC.sTime <= 1) {
          if (region.end - region.start <= 1) {
            region.update({
              start: prevTC.eTime,
              end: prevTC.eTime + 1,
            });
          } else {
            region.update({ start: prevTC.eTime });
          }
          // 모델 동기화
          currentTC.sTime = region.start;
        }
        // case2: 이전 영역을 밀기
        else {
          prevInst.update({ end: region.start });
          prevTC.eTime = region.start;
        }
      }
    }

    // 마지막으로, Map에 담긴 현재 TC 역시 업데이트
    currentTC.sTime = region.start;
    currentTC.eTime = region.end;

    // 인덱스·링크 재설정
    this.im_regionCheck();
  }

  public im_findCursor() {
    const progress =
      this.iv_wavesurfer.getCurrentTime() / this.iv_wavesurfer.getDuration();
    this.iv_wavesurfer.seekAndCenter(progress);
  }

  public im_fixCursor() {
    this.iv_control.iv_cursor.fix = !this.iv_control.iv_cursor.fix;
    if (this.iv_control.iv_cursor.fix) {
      this.iv_wavesurfer.params.autoCenter = true;
    } else {
      this.iv_wavesurfer.params.autoCenter = false;
    }
  }
}
