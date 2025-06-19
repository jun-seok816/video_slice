import { v4 as uuidv4 } from "uuid";

export class TimeCode {
  id: string;
  text: string;
  sTime: number;
  eTime: number;
  start: any;

  constructor(text: string, sTime: number, eTime: number, id?: string|null) {
    this.id = id || TimeCode.makeID();
    this.text = text;
    this.sTime = sTime;
    this.eTime = eTime;
  }

  static makeID() {
    return uuidv4();
  }

  public static sm_isCorrectTimeForm(p_v: string) {
    const pattern = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}$/;
    return pattern.test(p_v);
  }

  public static removeLastPeriod(str: string) {
    if (str.charAt(str.length - 1) === ".") {
      return str.slice(0, -1);
    } else {
      return str;
    }
  }

  public static  commaTodot(commaTime: string) {
    return commaTime.replace(",", ".");
  }

  public static sm_time2Sec(p_time: string, p_startTime: number = 0) {
    const timeComponents = p_time.split(":");

    // 형식 검사
    if (timeComponents.length !== 3) {
      throw new Error("올바른 형식의 시간 문자열이 아닙니다.");
    }

    const hours = parseFloat(timeComponents[0]);
    const minutes = parseFloat(timeComponents[1]);
    const seconds = parseFloat(timeComponents[2]);

    // 숫자인지 확인
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      throw new Error("시간 문자열을 숫자로 변환할 수 없습니다.");
    }

    const totalSeconds = hours * 3600 + minutes * 60 + seconds + p_startTime;
    return totalSeconds;
  }

  public static sm_sec2time(p_time: string) {
    let pad = function (num: string | number, size: number) {
        return ("000" + num).slice(-size);
      },
      time = parseFloat(p_time).toFixed(3),
      hours = Math.floor(parseFloat(time) / 60 / 60),
      minutes = Math.floor(parseFloat(time) / 60) % 60,
      seconds = Math.floor(parseFloat(time) - minutes * 60),
      milliseconds = time.slice(-3);

    return (
      pad(hours, 2) +
      ":" +
      pad(minutes, 2) +
      ":" +
      pad(seconds, 2) +
      "." +
      pad(milliseconds, 3)
    );
  }

  public static sm_formatDuration(videoElement: HTMLMediaElement): string {
    // 비디오가 로딩되기 전에 duration이 NaN이거나 Infinity일 수 있으므로 체크
    if (
      !videoElement ||
      isNaN(videoElement.duration) ||
      videoElement.duration === Infinity
    ) {
      return "00:00:00.000";
    }

    // 비디오 길이를 밀리초 단위로 가져옵니다.
    const totalMilliseconds = Math.floor(videoElement.duration * 1000);
    const hours = Math.floor(totalMilliseconds / 3600000);
    const minutes = Math.floor((totalMilliseconds - hours * 3600000) / 60000);
    const seconds = Math.floor(
      (totalMilliseconds - hours * 3600000 - minutes * 60000) / 1000
    );
    const milliseconds = totalMilliseconds % 1000;

    // 시간, 분, 초, 밀리초를 두 자리(밀리초는 세 자리) 숫자로 맞추기
    const paddedHours = hours.toString().padStart(2, "0");
    const paddedMinutes = minutes.toString().padStart(2, "0");
    const paddedSeconds = seconds.toString().padStart(2, "0");
    const paddedMilliseconds = milliseconds.toString().padStart(3, "0");

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}.${paddedMilliseconds}`;
  }

  public static sm_getDuration(startTime: string, endTime: string): number {
    const parseTime = (time: string): number => {
      const parts = time.split(":");
      const secondsParts = parts[2].split(".");
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      const seconds = Number(secondsParts[0]);
      const milliseconds = secondsParts[1] ? Number(secondsParts[1]) : 0;

      return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    };

    const startSeconds = parseTime(startTime);
    const endSeconds = parseTime(endTime);

    return endSeconds - startSeconds;
  }
}
