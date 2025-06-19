export class Timeline_module{
    public formatTimeCallback(seconds: number, pxPerSec: number) {
        seconds = Number(seconds);
        var minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
      
        // fill up seconds with zeroes
        var secondsStr = Math.round(seconds).toString();
        if (pxPerSec >= 25 * 10) {
            secondsStr = seconds.toFixed(2);
        } else if (pxPerSec >= 25 * 1) {
            secondsStr = seconds.toFixed(0);
        }
      
        if (minutes > 0) {
            if (seconds < 10) {
                secondsStr = '0' + secondsStr;
            }
            return `${minutes}:${secondsStr}`;
        }
        return secondsStr;
      }
      
      /**
      * Use timeInterval to set the period between notches, in seconds,
      * adding notches as the number of pixels per second increases.
      *
      * Note that if you override the default function, you'll almost
      * certainly want to override formatTimeCallback, primaryLabelInterval
      * and/or secondaryLabelInterval so they all work together.
      *
      * @param: pxPerSec
      */
      public timeInterval(pxPerSec: number) {
          var retval = 1;
          if (pxPerSec >= 25 * 100) {
              retval = 0.01;
          } else if (pxPerSec >= 25 * 40) {
              retval = 0.025;
          } else if (pxPerSec >= 200) {
              retval = 1;
          } else if (pxPerSec >= 25 * 4) {
              retval = 5;
          } else if (pxPerSec >= 25 * 2) {
              retval = 5;
          } else if (pxPerSec >= 25) {
              retval = 5;
          } else if (pxPerSec * 5 >= 25) {
              retval = 10;
          } else if (pxPerSec * 15 >= 25) {
              retval = 15;
          } else {
              retval = Math.ceil(0.5 / pxPerSec) * 60;
          }
          return retval;
      }
      
      /**
      * Return the cadence of notches that get labels in the primary color.
      * EG, return 2 if every 2nd notch should be labeled,
      * return 10 if every 10th notch should be labeled, etc.
      *
      * Note that if you override the default function, you'll almost
      * certainly want to override formatTimeCallback, primaryLabelInterval
      * and/or secondaryLabelInterval so they all work together.
      *
      * @param pxPerSec
      */
      public primaryLabelInterval(pxPerSec: number) {
        var retval = 1;
        if (pxPerSec >= 25 * 100) {
            retval = 10;
        } else if (pxPerSec >= 25 * 40) {
            retval = 4;
        } else if (pxPerSec >= 200) {
            retval = 1;
        } else if (pxPerSec >= 25 * 4) {
            retval = 1;
        } else if (pxPerSec >= 25 * 2) {
          retval = 2;
       } else if (pxPerSec >= 25) {
            retval = 1;
        } else if (pxPerSec * 5 >= 25) {
            retval = 5;
        } else if (pxPerSec * 15 >= 25) {
            retval = 15;
        } else {
            retval = Math.ceil(0.5 / pxPerSec) * 60;
        }
        return retval;
      }
      
      /**
      * Return the cadence of notches to get labels in the secondary color.
      * EG, return 2 if every 2nd notch should be labeled,
      * return 10 if every 10th notch should be labeled, etc.
      *
      * Secondary labels are drawn after primary labels, so if
      * you want to have labels every 10 seconds and another color labels
      * every 60 seconds, the 60 second labels should be the secondaries.
      *
      * Note that if you override the default function, you'll almost
      * certainly want to override formatTimeCallback, primaryLabelInterval
      * and/or secondaryLabelInterval so they all work together.
      *
      * @param pxPerSec
      */
      public secondaryLabelInterval(pxPerSec: any) {  
        const lv_result =  this.timeInterval(pxPerSec)      
        // draw one every 10s as an example
        return Math.floor(10 / lv_result);
      }
}