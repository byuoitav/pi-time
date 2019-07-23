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
      return "--:--";
    }

    const hour = this.getHours();
    const min = this.getMinutes();

    if (!hour) {
      if (!this.data.duration && this.ampm) {
        return ":" + min + " " + this.ampm;
      }

      return ":" + min;
    }

    if (!this.data.duration && this.ampm) {
      return hour + ":" + min + " " + this.ampm;
    }

    return hour + ":" + min;
  }

  private keyboard: Keyboard;

  constructor(
    private ref: OverlayRef,
    @Inject(PORTAL_DATA)
    public data: {
      title: string;
      duration: boolean;
      save: (hours: string, mins: string, ampm?: string) => Observable<any>;
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
        default: this.data.duration ? 5 : 4
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

  updateValidKeys = () => {
    for (const key of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
      let valid = false;

      if (this.data.duration) {
        switch (this.time.length) {
          case 0:
            valid = key === 0 ? false : true;
            break;
          case 5:
            valid = false;
            break;
          default:
            valid = true;
            break;
        }
      } else {
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
            valid = key <= 5 ? true : false;
            break;
          case 0:
            valid = key === 0 ? false : true;
            break;
        }
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

  getHours = (): string => {
    switch (this.time.length) {
      case 0:
        return undefined;
      case 1:
        return undefined;
      case 2:
        return undefined;
      default:
        return this.time.slice(0, this.time.length - 2);
    }
  };

  getMinutes = (): string => {
    switch (this.time.length) {
      case 0:
        return undefined;
      case 1:
        return this.time.slice(0, 1);
      case 2:
        return this.time.slice(0, 2);
      default:
        return this.time.slice(-2);
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
    if (this.data.duration) {
      return this.time.length > 0;
    } else {
      if (this.time.length <= 2 || !this.ampm) {
        return false;
      }
    }

    return true;
  };

  save = async (): Promise<boolean> => {
    if (!this.valid()) {
      return new Promise<boolean>((resolve, reject) => {
        resolve(false);
      });
    }

    const hours = this.getHours();
    const mins = this.getMinutes();

    return new Promise<boolean>((resolve, reject) => {
      this.data.save(hours, mins, this.ampm).subscribe(
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
