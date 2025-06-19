import React, { RefObject, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export class Main {
  private iv_UpdateData!: React.Dispatch<React.SetStateAction<object>>;
  public iv_navigate: any;
  private iv_Prepared: boolean = false;

  private iv_RenderCount = 0;
  public get pt_RenderCount() {
    return this.iv_RenderCount;
  }

  static iv_Swal = withReactContent(Swal);

  constructor() {}

  //                                                     +------------------------------
  //-----------------------------------------------------+ Hooks
  //                                                     +------------------------------
  /**
   * @description
   *   Hooks Component 시작점에서 호출 되어야 한다.
   *
   * @Revision
   *   00. Job    : Create
   *       Date   : 2022.7.24
   *       Worker : junseok816@gmail.com
   *       Note   :
   */
  public im_Prepare_Hooks(p_FirstRender?: () => void) {
    [, this.iv_UpdateData] = React.useState({});
    this.iv_Prepared = true;
    this.iv_RenderCount++;

    if (this.iv_RenderCount === 1) {
      if (p_FirstRender) p_FirstRender();
    }
  }
  //                                                     +------------------------------
  //-----------------------------------------------------+ Render
  //                                                     +------------------------------
  /**
   * @description
   *   Hooks Component 에서 Render 가 발행하도록 한다.
   *
   * @Revision
   *   00. Job    : Create
   *       Date   : 2022.7.24
   *       Worker : junseok816@gmail.com
   *       Note   :
   */
  public im_forceRender() {
    if (!this.iv_Prepared) return;
    this.iv_UpdateData({});
  }
  //                                                     +------------------------------
  //-----------------------------------------------------+ Lifecycle
  //                                                     +------------------------------
  /**
   * @description
   *   Hooks Component 의 Mounted 시점
   *   보통 Event 연결작업을 한다.
   *
   * @Revision
   *   00. Job    : Create
   *       Date   : 2022.7.24
   *       Worker : junseok816@gmail.com
   *       Note   :
   */
  public im_Mounted(p_Callback: () => void) {
    useEffect(p_Callback, []);
  }

  public im_Mounted_byData(p_Callback: () => void, p_data: any) {
    useEffect(p_Callback, p_data);
  }

  /**
   * @description
   *   Hooks Component 의 UnMounted 시점
   *   보통 Cleanup 작업을 위해서 사용한다.
   *
   * @Revision
   *   00. Job    : Create
   *       Date   : 2022.2.24
   *       Worker : junseok816@gmail.com
   *       Note   :
   */
  public im_UnMounted(p_Callback: () => void) {
    useEffect(() => {
      return p_Callback;
    }, []);
  }

  public im_navigate(p_path: string | number) {
    // 스크롤을 페이지의 최상단 왼쪽으로 초기화
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    document.body.scrollLeft = 0; // X축 스크롤 초기화 (필요시)
    document.documentElement.scrollLeft = 0; // X축 스크롤 초기화 (필요시)
    this.iv_navigate(p_path);
  }

  /**
   *
   * @param p_text 토스트에 띄울 메세지
   */
  public static im_toast(
    p_text: string,
    p_property: "info" | "error" | "success" | "warn"
  ): void {
    toast[p_property](p_text);
  }

  public static im_alertMsg(msg: string) {
    return this.iv_Swal.fire({
      title: <span>{msg}</span>,
      background: "#f3f7fa",
      color: "#24262b",
      confirmButtonColor: "#6A8BF0",
      cancelButtonColor: "#3b4044",
    });
  }

  public static im_askYesOrNoToUser(
    msg: string,
    submsg?: string
  ): Promise<boolean> {
    return new Promise((res, rej) => {
      try {
        this.iv_Swal
          .fire({
            title: <span className="mt-3 mb-3">알림</span>,
            html: (
              <div className="d-flex flex-column gap-2">
                <p>{msg}</p>
                <span>{submsg}</span>
              </div>
            ),
            showCancelButton: true,
            background: "#f3f7fa",
            color: "#454545",
            confirmButtonColor: "#6A8BF0",
            cancelButtonColor: "#3b4044",
            confirmButtonText: "네",
            cancelButtonText: "아니요",
          })
          .then((result) => {
            if (result.value) {
              res(true);
            } else {
              res(false);
            }
          });
      } catch (err) {
        rej(false);
      }
    });
  }
}
