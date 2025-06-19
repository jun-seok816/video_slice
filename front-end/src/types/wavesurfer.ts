import { TimeCode } from "@BackEnd/src/class/Timecode";

interface HandleStyle {
    cursor: string;
    position: string;
    width: string;
    maxWidth: string;
    backgroundColor: string;
  }
  
interface RegionAttributes {
    index: number;
    beforeRegion: TimeCode
    beforeIndex: number;
    nextRegion: TimeCode
    nextIndex: number;
}
  
export interface Region {
    remove():any;
    update(arg0: any):any;
    wrapper: object;
    util: object;
    regionsUtil: object;
    vertical: boolean;
    id: string;
    start: number;
    end: number;
    resize: boolean;
    drag: boolean;
    isResizing: boolean;
    isDragging: boolean;
    loop: boolean;
    color: string;
    handleStyle: {
        left: HandleStyle;
        right: HandleStyle;
    };
    handleLeftEl: object;
    handleRightEl: object;
    data: object;
    attributes: RegionAttributes;
    showTooltip: boolean;
    minLength: number;
    scroll: boolean;
    scrollSpeed: number;
    scrollThreshold: number;
    preventContextMenu: boolean;
    channelIdx: number;
    regionHeight: string;
    marginTop: string;
    edgeScrollWidth: number;
    firedIn: boolean;
    firedOut: boolean;
    handlers: {
        remove: (null | object)[];
        out: (null | object)[];
    };
    element: object;
}
  