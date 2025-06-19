export {};

declare global {
  interface Window {
    gm_forceRender: () => void;
    gv_canMoveSubtitle: boolean;
    gv_lastCursorY: null | number;
    gv_sw_style: {
      bottom: number;
    };
    gv_fontSize: number;
    gv_waveRange: number;
    gv_videotag: HTMLMediaElement | null | undefined;
  }
}
