import { TimeCode } from "@BackEnd/src/class/Timecode";

type t_Dived = {
    open:boolean;
    textA:string;
    textB:string;
    divTime:number;
}

export class Devide{
    private iv_devide:t_Dived;
    private iv_selectedTimeCode:TimeCode|undefined;

    constructor(){
        this.iv_selectedTimeCode = undefined;
        this.iv_devide = {
            open:false,
            textA:'',
            textB:'',
            divTime:0,
        }
    }

    public get pt_devide():t_Dived{
        return this.iv_devide;
    }

    public set pt_devide(p_d:t_Dived){
        this.iv_devide = p_d;
    }

    public get pt_selectedTimeCode(){
        return this.iv_selectedTimeCode;
    }


    private im_splitBySpaceToHalf(p_str: string) {
        const arr = p_str.split(" ");
        const arrLength = arr.length;
        const halfLength = Math.ceil(arrLength / 2);
    
        const arr1 = arr.slice(0, halfLength).join(" ");
        const arr2 = arr.slice(halfLength).join(" ");
    
        return [arr1, arr2];
    }

    public im_divideButtonClicked(p_timecode: TimeCode): void {
        this.iv_selectedTimeCode = p_timecode;
        const iv_textArr = this.im_splitBySpaceToHalf(p_timecode.text);
        this.iv_devide.divTime = Math.floor((p_timecode.sTime + p_timecode.eTime)/2);
        this.pt_devide.textA = iv_textArr[0];
        this.pt_devide.textB = iv_textArr[1];
        
        window.gm_forceRender();
    }
}