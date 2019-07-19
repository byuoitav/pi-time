import {
  Component,
  OnInit,
  Inject,
  ViewEncapsulation,
  AfterViewInit
} from "@angular/core";
import { OverlayRef } from "@angular/cdk/overlay";
import { Observable } from "rxjs";
import Keyboard from "simple-keyboard";

import { PORTAL_DATA } from "../../objects";

enum AMPM {
  AM = "AM",
  PM = "PM"
}

@Component({
  selector: "time-entry",
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./time-entry.component.html",
  styleUrls: [
    "./time-entry.component.scss",
    "../../../../node_modules/simple-keyboard/build/css/index.css"
  ]
})
export class TimeEntryComponent implements OnInit, AfterViewInit {
  public time = "";
  public ampm: AMPM;

  get value(): string {
    if (!this.time) {
      if (this.ampm) {
        return "--:-- " + this.ampm;
      }

      return "--:--";
    }

    let sliceIdx = this.time.length === 3 ? 1 : 2;
    const str =
      this.time.length >= 3
        ? this.time.slice(0, sliceIdx) +
          ":" +
          this.time.slice(sliceIdx, this.time.length)
        : this.time;

    if (!this.ampm) {
      return str;
    }

    return str + " " + this.ampm;
  }

  private keyboard: Keyboard;

  constructor(
    private ref: OverlayRef,
    @Inject(PORTAL_DATA)
    private data: {
      ref: any;
      title: string;
      duration: boolean;
      save: (ref: any, hour: Number, min: Number) => Observable<any>;
      error: () => void;
    }
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.keyboard = new Keyboard({
      onChange: this.onChange,
      onKeyPress: this.onKeyPress,
      layout: {
        default: ["1 2 3", "4 5 6", "7 8 9", "0 {bksp}"]
      },
      mergeDisplay: true,
      display: {
        "{bksp}": "⌫"
      },
      buttonTheme: [
        {
          buttons: "1 2 3 4 5 6 7 8 9 0 {bksp}",
          class: "keyboard-tall-button"
        }
      ],
      maxLength: {
        default: 4
      },
      useTouchEvents: true
    });

    this.updateValidKeys();
  }

  onChange = (input: string) => {
    this.time = input;
    this.updateValidKeys();
  };

  onKeyPress = (button: string) => {};

  // TODO fix for duration
  updateValidKeys = () => {
    for (const key of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
      let valid = false;

      switch (this.time.length) {
        case 4:
          valid = false;
          break;
        case 3:
          const hour = Number(this.time.slice(0, 2));
          const min = Number(this.time.charAt(2));

          if (hour > 12) {
            valid = false;
          } else {
            if (min >= 6) {
              valid = false;
            } else {
              valid = true;
            }
          }

          break;
        case 2:
          valid = true;
          break;
        case 1:
          // keys 0-5 are valid
          valid = key <= 5 ? true : false;
          break;
        case 0:
          // all keys except 0 are valid
          valid = key === 0 ? false : true;
          break;
      }

      if (valid) {
        this.keyboard.removeButtonTheme(
          key.toString(),
          "keyboard-button-disabled"
        );
      } else {
        this.keyboard.addButtonTheme(
          key.toString(),
          "keyboard-button-disabled"
        );
      }
    }

    if (this.time.length === 0) {
      this.keyboard.addButtonTheme("{bksp}", "keyboard-button-disabled");
    } else {
      this.keyboard.removeButtonTheme("{bksp}", "keyboard-button-disabled");
    }
  };

  getHours = (): Number => {
    switch (this.time.length) {
      case 4:
        return Number(this.time.slice(0, 2));
      case 3:
        return Number(this.time.slice(0, 1));
      default:
        return 0;
    }
  };

  getMinutes = (): Number => {
    switch (this.time.length) {
      case 4:
        return Number(this.time.slice(2, 4));
      case 3:
        return Number(this.time.slice(1, 3));
      default:
        return 0;
    }
  };

  onInputChange = (event: any) => {
    this.keyboard.setInput(event.target.value);
  };

  toggleAMPM = () => {
    if (this.ampm) {
      this.ampm = this.ampm === AMPM.AM ? AMPM.PM : AMPM.AM;
    } else {
      this.ampm = AMPM.AM;
    }
  };

  valid = (): boolean => {
    return true;
  };

  save = async (): Promise<boolean> => {
    if (!this.valid()) {
      return new Promise<boolean>((resolve, reject) => {
        resolve(false);
      });
    }

    const hour = this.getHours();
    const minute = this.getMinutes();

    return new Promise<boolean>((resolve, reject) => {
      this.data.save(this.data.ref, hour, minute).subscribe(
        data => {
          resolve(true);
        },
        err => {
          resolve(false);
        }
      );
    });
  };

  cancel = () => {
    this.ref.dispose();
  };

  error = () => {
    this.keyboard.destroy();
    this.data.error();
    this.ref.dispose();
  };
}
