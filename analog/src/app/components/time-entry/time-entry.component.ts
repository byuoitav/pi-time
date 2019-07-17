import {
  Component,
  OnInit,
  Inject,
  ViewEncapsulation,
  AfterViewInit
} from "@angular/core";
import { OverlayRef } from "@angular/cdk/overlay";
import Keyboard from "simple-keyboard";

import { PORTAL_DATA } from "../../objects";

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
  public value = "";

  private keyboard: Keyboard;

  constructor(
    private ref: OverlayRef,
    @Inject(PORTAL_DATA)
    private data: {
      save: (time: Date) => void;
    }
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.keyboard = new Keyboard({
      onChange: input => {
        // if (input.length > 4) {
        //   return;
        // }
        // punch.editedTime = input;
        // if (!this.validEditTime(punch)) {
        //   keyboard.addButtonTheme("{done}", "keyboard-button-disabled");
        // } else {
        //   keyboard.removeButtonTheme("{done}", "keyboard-button-disabled");
        // }
      },
      onKeyPress: button => {
        // switch (button) {
        //   case "{ampm}":
        //     switch (punch.editedAMPM) {
        //       case "PM":
        //         punch.editedAMPM = "AM";
        //         return;
        //       case "AM":
        //         punch.editedAMPM = "PM";
        //         return;
        //       default:
        //         punch.editedAMPM = "AM";
        //         return;
        //     }
        //   case "{done}":
        //     element.classList.remove("editing");
        //     if (!punch.editedTime || punch.editedTime.includes("--:--")) {
        //       punch.editedAMPM = undefined;
        //     }
        //     keyboard.destroy();
        //     this.keyboardOpen = false;
        //     return;
        //   case "{cancel}":
        //     element.classList.remove("editing");
        //     punch.editedTime = undefined;
        //     punch.editedAMPM = undefined;
        //     keyboard.destroy();
        //     this.keyboardOpen = false;
        //     return;
        // }
      },
      layout: {
        default: [
          "1 2 3",
          "4 5 6",
          "7 8 9",
          "{ampm} 0 {bksp}",
          "{cancel} {done}"
        ]
      },
      mergeDisplay: true,
      display: {
        "{bksp}": "⌫",
        "{ampm}": "AM/PM",
        "{done}": "Done",
        "{cancel}": "Cancel"
      },
      buttonTheme: [
        {
          buttons: "{done}",
          class: "keyboard-button-disabled"
        }
      ],
      maxLength: {
        default: 4
      },
      useTouchEvents: true
    });
  }

  onChange = (input: string) => {
    this.value = input;
  };

  onKeyPress = (button: string) => {};

  onInputChange = (event: any) => {
    this.keyboard.setInput(event.target.value);
  };

  cancel = () => {
    this.ref.dispose();
  };
}
