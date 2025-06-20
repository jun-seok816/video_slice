import { Main } from "@jsLib/class/Main_class";
import { WaveForm } from "./WaveForm";
import { TimeCode } from "@BackEnd/src/class/Timecode";
import { I_timecode_items } from "@jsLib/component/editor/TimecodeItem";
import { Devide } from "./Devide";
import { ChangeEvent, useEffect } from "react";
import _ from "lodash";
import axios from "axios";

export class Main_editor extends Main implements I_timecode_items {
  private iv_Wavesurfer: WaveForm | undefined;
  private iv_TimeCode: TimeCode | undefined;
  private iv_Devide: Devide;

  public iv_videoReady: boolean;
  public iv_tourStart: boolean;

  constructor() {
    super();
    this.iv_tourStart = false;
    this.iv_videoReady = false;
    this.iv_Wavesurfer = undefined;
    this.iv_TimeCode = undefined;
    this.iv_Devide = new Devide();
  }

  public get pt_Wavesurfer(): WaveForm | undefined {
    return this.iv_Wavesurfer;
  }

  public get pt_Devide(): Devide {
    return this.iv_Devide;
  }

  public set pt_Wavesurfer(p_wavesurfer: WaveForm | undefined) {
    if (p_wavesurfer === undefined) return;
    if (this.iv_Wavesurfer) return;
    this.iv_Wavesurfer = p_wavesurfer;
  }

  public get pt_TimeCode(): TimeCode | undefined {
    return this.iv_TimeCode;
  }

  public im_TimeLinePrevNext(pm: 1 | -1) {
    if (this.pt_Wavesurfer) {
      // Map 기반으로 전환한 코드
      const targetId = this.pt_Wavesurfer.pt_control.iv_targetRegion?.id;
      if (!targetId) return;

      // 1) Map의 키 배열 확보
      const keys = Array.from(this.pt_Wavesurfer.pt_region.regionList.keys());

      // 2) 현재 ID의 인덱스 찾기
      const currentIndex = keys.indexOf(targetId);
      if (currentIndex === -1) return;

      // 3) pm 만큼 이동한 키 계산
      const nextKey = keys[currentIndex + pm];
      if (!nextKey) return; // 범위를 벗어나면 종료

      // 4) Map에서 TimeCode 꺼내기
      const nextRegion = this.pt_Wavesurfer.pt_region.regionList.get(nextKey);
      if (!nextRegion) return;

      // 이제 `nextRegion`을 안전하게 사용하실 수 있습니다
      console.log("이동된 구간:", nextRegion);
      if (nextRegion === undefined) return;
      document.getElementById(`timebox_txt_${currentIndex}`)?.blur();
      document.getElementById(`timebox_txt_${currentIndex + pm}`)?.focus();
      if (window.gv_videotag) window.gv_videotag.currentTime = nextRegion.sTime;
      this.pt_Wavesurfer.pt_control.iv_targetRegion = nextRegion;
      this.pt_Wavesurfer?.im_updateRegionStyle();
      this.im_forceRender();
    }
  }

  public async im_doDivide() {
    const selected = _.cloneDeep(this.pt_Devide.pt_selectedTimeCode);
    const divData = this.pt_Devide.pt_devide;
    if (!selected || !divData || !this.iv_Wavesurfer) {
      Main.im_toast("나누기 에러", "error");
      return;
    }

    // 1) Map과 키 배열 준비
    const regionMap = this.iv_Wavesurfer.pt_region.regionList;
    const keys = Array.from(regionMap.keys());

    // 2) 선택된 TimeCode 인덱스 구하기
    const idx = keys.indexOf(selected.id);
    if (idx === -1) {
      Main.im_toast("선택된 구간을 찾을 수 없습니다.", "error");
      return;
    }

    // ✅ (여기서 구간 길이 제한 검사)
    const MIN_DURATION = 1; // 최소 1초
    const aDuration = divData.divTime - selected.sTime;
    const bDuration = selected.eTime - divData.divTime;

    if (aDuration < MIN_DURATION || bDuration < MIN_DURATION) {
      Main.im_toast("각 구간은 최소 1초 이상이어야 합니다.", "error");
      return;
    }

    // 3) 선택된 TC 업데이트 (A 구간)
    const tcA = regionMap.get(selected.id)!;
    tcA.eTime = divData.divTime;
    tcA.text = divData.textA;

    // 4) 나머지 B 구간 생성
    const newId = this.iv_Wavesurfer.im_addTimecode(
      divData.divTime,
      selected.eTime,
      false
    );
    if (!newId) {
      Main.im_toast("구간 생성 실패", "error");
      return;
    }

    // 5) 생성된 B 구간 텍스트 설정
    const tcB = regionMap.get(newId);
    if (tcB) {
      tcB.text = divData.textB;
    }

    this.pt_Wavesurfer?.im_sortingByRegionListData();

    // 7) 모달 닫기
    this.pt_Devide.pt_devide.open = false;
  }

  public im_playPause() {
    if (window.gv_videotag) {
      if (window.gv_videotag.paused) {
        window.gv_videotag.play();
      } else {
        window.gv_videotag.pause();
      }
      this.im_forceRender();
    }
  }

  public async im_load_save() {
    try {
      let json = await axios.get(
        "/data/J1R0WvHh7muKBWspTSnT1VKTn6Qo6J_21.json"
      );

      this.pt_Wavesurfer?.im_resetAll();

      // 1) 서버에서 받아온 TimeCode 배열 가정
      const fetched: TimeCode[] = json.data;
      fetched.map((e) => {
        this.pt_Wavesurfer?.pt_region.regionList.set(e.id, e);
      });

      // 3) Wavesurfer에 한 번만 넘겨서 Map으로 교체
      if (this.pt_Wavesurfer) {
        this.pt_Wavesurfer.setRegionsData(
          this.pt_Wavesurfer?.pt_region.regionList
        );
      }

      this.im_forceRender();
    } catch (err) {
      Main.im_toast("불러오기 실패", "error");
      this.im_forceRender();
    }
  }

  public im_nextAddButtonClicked(p_timecode: TimeCode): void {
    if (this.iv_Wavesurfer === undefined) return;
    const iv_reginID = p_timecode.id;
    const iv_region_object =
      this.iv_Wavesurfer?.pt_wavesurfer.regions.list[iv_reginID];

    if (!window.gv_videotag) return;
    //다음 리전이 존재한다면
    if (iv_region_object?.attributes.nextIndex) {
      //case1 ) 다음 타겟보다 현재 커서 위치가 작고, 시작 시간으로부터 0.5초 이상의 텀이 된다면
      if (
        window.gv_videotag.currentTime <=
          iv_region_object.attributes.nextRegion.sTime &&
        window.gv_videotag.currentTime - iv_region_object.end >= 0.5
      ) {
        this.iv_Wavesurfer.im_addTimecode(
          iv_region_object.end + 0.0009,
          window.gv_videotag.currentTime
        );
      } else {
        this.iv_Wavesurfer.im_addTimecode(iv_region_object.end + 0.0009);
      }
    } else {
      //다음 리전이 없다면
      if (window.gv_videotag.currentTime - iv_region_object.end >= 0.5) {
        this.iv_Wavesurfer.im_addTimecode(
          iv_region_object.end + 0.0009,
          window.gv_videotag.currentTime
        );
      } else {
        this.iv_Wavesurfer.im_addTimecode(iv_region_object.end + 0.0009);
      }
    }

    this.im_forceRender();
  }

  public im_deleteButtonClicked(p_timecode: TimeCode): void {
    if (this.iv_Wavesurfer === undefined) return;
    const wc = this.iv_Wavesurfer.pt_wavesurfer.regions.list[p_timecode.id];
    if (wc) wc.remove();
    this.iv_Wavesurfer.pt_region.regionList.delete(p_timecode.id);
    this.iv_Wavesurfer.im_sortingByRegionListData();
    this.im_forceRender();
  }

  public async im_mergeTimeline(
    p_timecode: TimeCode,
    index: number
  ): Promise<void> {
    if (this.iv_Wavesurfer === undefined || this.pt_Wavesurfer === undefined)
      return;
    if (!(await Main.im_askYesOrNoToUser("타임라인을 합칠까요?"))) return;
    const keys = Array.from(this.pt_Wavesurfer?.pt_region.regionList.keys());
    let regionList = keys.map(
      (k) => this.pt_Wavesurfer?.pt_region.regionList.get(k)!
    );

    if (index !== this.iv_Wavesurfer.pt_region.regionList.size - 1) {
      const lv_next_region = regionList[index + 1];
      const lv_new_text = `${p_timecode.text}${lv_next_region.text}`;
      if (lv_new_text.length > 100) {
        Main.im_toast("최대 100글자까지 합칠 수 있습니다.", "warn");
        return;
      }

      const lv_timecode = new TimeCode(
        lv_new_text,
        p_timecode.sTime,
        lv_next_region.eTime
      );
      this.iv_Wavesurfer.pt_wavesurfer.regions.list[p_timecode.id].remove();
      this.iv_Wavesurfer.pt_wavesurfer.regions.list[lv_next_region.id].remove();
      this.iv_Wavesurfer.pt_region.regionList.delete(p_timecode.id);
      this.iv_Wavesurfer.pt_region.regionList.delete(lv_next_region.id);
      this.iv_Wavesurfer.pt_region.regionList.set(lv_timecode.id, lv_timecode);

      this.iv_Wavesurfer.im_sortingByRegionListData();
    }

    this.im_forceRender();
  }

  public im_timeEdited(
    p_e: ChangeEvent<HTMLInputElement>,
    p_targetEleName: "sTime" | "eTime",
    p_indexInArray: number,
    p_timecode: TimeCode
  ): void {
    if (this.iv_Wavesurfer === undefined) {
      Main.im_toast("wavesurfer is undefined", "error");
      return;
    }
    // 0 - 형식 체크, 및 제대로 된 숫자인지 형식이 맞지않으면 이전으로 되돌림
    if (!TimeCode.sm_isCorrectTimeForm(p_e.target.value)) {
      Main.im_toast("형식에 맞지 않는 시간입니다.", "error");
      return;
    }

    const id = p_timecode.id;
    const keys = Array.from(this.iv_Wavesurfer!.pt_region.regionList.keys());
    const regionList = keys.map(
      (k) => this.iv_Wavesurfer!.pt_region.regionList.get(k)!
    );
    let secTime = TimeCode.sm_time2Sec(p_e.target.value);
    // 0 - sTime 일경우 앞 인덱스의 eTime보다 작으면 안되고, 자신의 eTime보다 크면 안된다 <-> eTime 일 경우는 반대
    if (p_targetEleName == "sTime") {
      // 1) 이전 인덱스의 종료보다 작으면 안됨

      if (
        p_indexInArray != 0 &&
        regionList[p_indexInArray - 1].eTime > secTime
      ) {
        // 첫번째 인덱스 일 경우는 0:00 보다만 크면 되나 애초에 음수는 넣지 못하므로 넘어가므로 무시
        Main.im_toast("이전 인덱스의 종료 시간보다 커야합니다.", "error");
        return;
      }

      // 2) 현재 인덱스의 종료시간보다 0.5초 이상 차이가 나야함
      if (regionList[p_indexInArray].eTime - 0.5 < secTime) {
        Main.im_toast("종료 시간과 0.5초 이상 텀이 있어야 합니다.", "error");
        return;
      }

      regionList[p_indexInArray].sTime = secTime;
      // 정상적으로 여기까지 도달했으면 wavesurfer의 시간을 조정해줌
      this.pt_Wavesurfer?.pt_wavesurfer.regions.list[id].update({
        start: secTime,
      });
    } else {
      // 1) 다음 인덱스의 시작보다 크면 안됨
      if (
        regionList.length - 1 > p_indexInArray &&
        regionList[p_indexInArray + 1].sTime < secTime
      ) {
        // 첫번째 인덱스 일 경우는 0:00 보다만 크면 되나 애초에 음수는 넣지 못하므로 넘어가므로 무시
        Main.im_toast("다음 인덱스의 시작 시간보다 작아야합니다.", "error");
        return;
      }

      // 2) 현재 인덱스의 시작시간보다 0.5초 이상 차이가 나야함
      if (regionList[p_indexInArray].sTime + 0.5 > secTime) {
        Main.im_toast("시작 시간과 0.5초 이상 텀이 있어야 합니다.", "error");
        return;
      }

      regionList[p_indexInArray].eTime = secTime;
      // 정상적으로 여기까지 도달했으면 wavesurfer의 시간을 조정해줌
      this.pt_Wavesurfer!.pt_wavesurfer.regions.list[id].update({
        end: secTime,
      });
    }
  }

  private im_changeWordModal(): Promise<any> {
    return new Promise((res, rej) => {
      try {
        Main.iv_Swal
          .fire({
            title: '<span class="mt-3 mb-3" style="">단어 변경</span>',
            html: `
          <div class="p-1 d-flex justify-content-evenly align-items-center gap-2">
              <input id="change_start_word" type="text" name="change_start_word" class="form-control focus-shadow-none border-0" autofocus>
              <i class="bi bi-arrow-left-right"></i>
              <input id="change_end_word" type="text" name="change_end_word" class="form-control focus-shadow-none border-0">
          </div>`,
            didOpen: () => {
              const inputElement = document.getElementById("change_start_word");
              if (inputElement) {
                inputElement.focus();
              }
            },
            showCancelButton: true,
            color: "#24262b",
            background: "#f3f7fa",
            confirmButtonColor: "#6A8BF0",
            cancelButtonColor: "#3b4044",
            confirmButtonText: "다음",
            cancelButtonText: "취소",
          })
          .then((result) => {
            const lv_changeStartWord_Dom = document.getElementById(
              "change_start_word"
            ) as HTMLInputElement;
            const lv_changeEndWord_Dom = document.getElementById(
              "change_end_word"
            ) as HTMLInputElement;
            if (result.value) {
              res({
                error: false,
                data: {
                  changeStartWord: lv_changeStartWord_Dom.value ?? "",
                  changeEndWord: lv_changeEndWord_Dom.value ?? "",
                },
              });
            } else {
              res({
                error: true,
              });
            }
          });
      } catch (error) {
        rej({
          error: true,
        });
      }
    });
  }

  public im_replaceAll(str: string, find: string, replace: string): string {
    if (find.length === 0) {
      return str;
    }

    const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lv_string = str.replace(new RegExp(escapedFind, "gi"), replace);

    return lv_string;
  }

  public async im_changeWords() {
    try {
      const res = await this.im_changeWordModal();

      if (!res.error) {
        const { changeStartWord, changeEndWord } = res.data;

        if (changeStartWord.replace(/ /g, "") === "") {
          Main.im_alertMsg("찾는 단어는 필수입니다.");
          return;
        }

        this.iv_Wavesurfer?.pt_region.regionList.forEach((e) => {
          e.text = this.im_replaceAll(e.text, changeStartWord, changeEndWord);
        });

        window.gm_forceRender();

        Main.im_alertMsg("변경되었습니다.");
      }
    } catch (err) {
      Main.im_alertMsg("시스템 오류로 인해 단어 변경에 실패하였습니다.");
    }
  }

  private im_changeTimesModal(): Promise<any> {
    return new Promise((res, rej) => {
      try {
        Main.iv_Swal
          .fire({
            title: '<span class="mt-3 mb-3">시간 앞당기기 / 지연</span>',
            html: `
              <div class="h6 text-gray" style="color: gray;">여러 개의 타임라인들의 시간을 한번에 조정 할 수 있습니다.</div>
          <div class="flex-wrap mt-4 d-flex">
            <div style="width:100%" class="d-flex justify-content-center align-items-center">
                <div style="width: 40%;">
                    <div class="mb-2 h3">시작번호</div>
                    <div><input id="change_start_index" step="1" type="number" max="${this.pt_Wavesurfer?.pt_region.regionList.size}" min="1" value="1" name="change_start_index" class="form-control text-center"></div>
                </div>
                <span class="mx-3"></span>
                <div style="width: 40%;">
                    <div class="mb-2 h3">종료번호</div>
                    <div><input id="change_end_index" step="1" type="number" max="${this.pt_Wavesurfer?.pt_region.regionList.size}" min="1" value="${this.pt_Wavesurfer?.pt_region.regionList.size}" class="form-control text-center" name="change_end_index"></div>
                </div>
            </div>
    
          </div>
          <div class="mt-5 mb-2">앞 당기기 / 지연 할 시간 ( 앞 당기기:  <span class="px-1 time_text_minus">-</span> , 지연: <span class="px-1 time_text_plus">+</span> )</div> 
          <div class="w-100 d-flex justify-content-center align-items-center mb-4">
            <input id="change_time" type="number" value=0 style="width: 30%;" name="change_time" class="pa-2 form-control text-center"> <span class="ml-2 ">초</span>
          </div>
          `,
            didOpen: () => {
              const inputElement =
                document.getElementById("change_start_index");
              if (inputElement) {
                inputElement.focus();
              }
            },
            showCancelButton: true,
            background: "#f3f7fa",
            color: "#24262b",
            confirmButtonColor: "#6A8BF0",
            cancelButtonColor: "#3b4044",
            confirmButtonText: "다음",
            cancelButtonText: "취소",
          })
          .then((result) => {
            if (result.value) {
              res({
                error: false,
                data: {
                  changeStartIndex:
                    //@ts-ignore
                    document.getElementById("change_start_index").value ?? 0,

                  changeEndIndex:
                    //@ts-ignore
                    document.getElementById("change_end_index").value ?? 0,
                  //@ts-ignore
                  changeTime: document.getElementById("change_time").value ?? 0,
                },
              });
            } else {
              rej({
                error: true,
              });
            }
          });
      } catch (error) {
        rej({
          eror: true,
        });
      }
    });
  }

  private im_openDeleteModal(): Promise<any> {
    return new Promise((res, rej) => {
      try {
        Main.iv_Swal
          .fire({
            title:
              '<span class="mt-3 mb-3" style="color: black;">타임라인 삭제</span>',
            html: `
              <div class="h6 text-gray" style="color: gray;">몇 번부터 몇 번까지 삭제할까요?</div>
              <div class="flex-wrap mt-4 d-flex">
                <div style="width:100%" class="d-flex justify-content-center align-items-center">
                    <div style="width: 40%;">
                        <div class="mb-2 h3">시작번호</div>
                        <div><input id="delete_start_num" step="1" type="number" max="${this.pt_Wavesurfer?.pt_region.regionList.size}" min="1" value="1" name="change_start_index" class="form-control text-center"></div>
                    </div>
                    <span class="mx-3"></span>
                    <div style="width: 40%;">
                        <div class="mb-2 h3">종료번호</div>
                        <div><input id="delete_end_num" step="1" type="number" max="${this.pt_Wavesurfer?.pt_region.regionList.size}" min="1" value="${this.pt_Wavesurfer?.pt_region.regionList.size}" class="form-control text-center" name="change_end_index"></div>
                    </div>
                </div>        
              </div>          
          `,
            didOpen: () => {
              const inputElement = document.getElementById("delete_start_num");
              if (inputElement) {
                inputElement.focus();
              }
            },
            showCancelButton: true,
            background: "#f3f7fa",
            color: "#24262b",
            confirmButtonColor: "#6A8BF0",
            cancelButtonColor: "#3b4044",
            confirmButtonText: "다음",
            cancelButtonText: "취소",
          })
          .then((result) => {
            if (result.value) {
              res({
                error: false,
                data: {
                  delete_start_num:
                    //@ts-ignore
                    document.getElementById("delete_start_num").value ?? 0,

                  delete_end_num:
                    //@ts-ignore
                    document.getElementById("delete_end_num").value ?? 0,
                },
              });
            } else {
              rej({
                error: true,
              });
            }
          });
      } catch (error) {
        rej({
          eror: true,
        });
      }
    });
  }

  public async im_changeTimes() {
    let res = await this.im_changeTimesModal();

    if (res) {
      const { changeStartIndex, changeEndIndex, changeTime } = res.data;
      if (this.pt_Wavesurfer === undefined) return;

      const keys = Array.from(this.pt_Wavesurfer?.pt_region.regionList.keys());
      let regionList = keys.map(
        (k) => this.pt_Wavesurfer?.pt_region.regionList.get(k)!
      );

      if (regionList === undefined) return;

      if (!window.gv_videotag) return;

      if (
        !(
          isFinite(changeStartIndex * 1) &&
          isFinite(changeEndIndex * 1) &&
          isFinite(changeTime * 1) &&
          regionList.length >= changeEndIndex * 1 &&
          regionList.length >= changeStartIndex * 1 &&
          changeStartIndex * 1 > 0 &&
          changeEndIndex * 1 > 0 &&
          changeStartIndex * 1 <= changeEndIndex * 1
        )
      ) {
        Main.im_alertMsg("잘못된 입력입니다.");
        return;
      }

      const delta = Number(parseFloat(changeTime).toFixed(0));

      // 만약 마이너스라면
      // 처음 것 보다 앞에 시간을 마이너스한게 커야함 확인해야함
      // 처음 것에 마이너스를 했을 때 0초 보다 커야함
      if (delta < 0 && changeStartIndex - 1 >= 0) {
        let startIndex = changeStartIndex - 1;

        if (regionList[startIndex].sTime + delta < 0) {
          Main.im_alertMsg("시간을 차감 할 경우 0초보다 작아집니다.");
          return;
        }

        if (startIndex - 1 >= 0) {
          // 이전 인덱스가 존재한다면 이전 인덱스의 종료시간보다 시작 시간이 커야함
          let prevIndex = startIndex - 1;
          if (
            regionList[prevIndex].eTime >
            regionList[startIndex].sTime + delta
          ) {
            Main.im_alertMsg(`가장 앞에 있는 타임라인이 그보다 
이전 타임라인보다 작아 질 수 없습니다.`);
            return;
          }
        }
      } else if (delta > 0 && changeEndIndex - 1 < regionList.length) {
        // 마지막 것 보다 뒤에 시간을 플러스한게 작아야함
        // 마지막 것에 플러스 했을 때 비디오 시간보다 작아야함
        let endIndex = changeEndIndex - 1;

        if (regionList[endIndex].eTime + delta > window.gv_videotag.duration) {
          Main.im_alertMsg("시간을 늘릴 경우 비디오 길이보다 커집니다.");
          return;
        }

        if (endIndex + 1 < regionList.length) {
          // 다음 인덱스가 존재한다면 다음 인덱스의 시작시간보다 종료 시간이 작아야함
          let nextIndex = endIndex + 1;

          if (
            regionList[nextIndex].sTime <
            regionList[endIndex].eTime + delta
          ) {
            Main.im_alertMsg(
              "가장 뒤에 있는 타임라인이 그보다 다음 타임라인보다 커 질 수 없습니다."
            );
            return;
          }
        }
      }

      // 정상적으로 적용
      const start = changeStartIndex - 1;
      const end = changeEndIndex - 1;

      for (let i = start; i <= end; i++) {
        const key = keys[i];
        const tc = this.pt_Wavesurfer.pt_region.regionList.get(key);
        console.log("before , %o", tc);
        if (tc) {
          tc.sTime = Number((tc.sTime + delta).toFixed(2));
          tc.eTime = Number((tc.eTime + delta).toFixed(2));
        }
        console.log("after , %o index %o", tc, i);
      }

      this.pt_Wavesurfer!.im_sortingByRegionListData();
      Main.im_alertMsg("시간이 변경되었습니다");
    }
  }

  public async im_deleteTimelines() {
    let { data } = await this.im_openDeleteModal();

    let { delete_start_num, delete_end_num } = data;

    let regionList = this.pt_Wavesurfer?.pt_region.regionList;

    if (regionList === undefined) return;

    if (!window.gv_videotag) return;

    if (
      !(
        isFinite(delete_start_num * 1) &&
        isFinite(delete_end_num * 1) &&
        regionList.size >= delete_end_num * 1 &&
        regionList.size >= delete_start_num * 1 &&
        delete_start_num * 1 > 0 &&
        delete_end_num * 1 > 0 &&
        delete_start_num * 1 <= delete_end_num * 1
      )
    ) {
      Main.im_alertMsg("잘못된 입력입니다.");
      return;
    }

    let startIndex = delete_start_num - 1;
    let endIndex = delete_end_num - 1;

    // Map의 키 배열을 가져와서 해당 범위의 키만 골라 Map에서 삭제
    const keysToDelete = Array.from(regionList.keys()).slice(
      startIndex,
      endIndex + 1
    );

    for (const key of keysToDelete) {
      regionList.delete(key);
    }
    this.iv_Wavesurfer?.im_sortingByRegionListData();
  }
}
