import { Component, OnInit, Input, ViewEncapsulation } from "@angular/core";
import Keyboard from "simple-keyboard";

import { Punch, PunchType } from "../../objects";

@Component({
  selector: "punches",
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./punches.component.html",
  styleUrls: [
    "./punches.component.scss",
    "../day-overview/day-overview.component.scss",
    "../../../../node_modules/simple-keyboard/build/css/index.css"
  ]
})
export class PunchesComponent implements OnInit {
  public punchType = PunchType;

  @Input() punches: Punch[] = [];
  keyboardOpen = false;

  constructor() {}

  ngOnInit() {}

  openKeyboard = (punch: Punch) => {
    if (this.keyboardOpen) {
      return;
    }

    this.keyboardOpen = true;
    const backspaceClicks = 0;

    const keyboard = new Keyboard({
      onChange: input => {
        if (input.length > 4) {
          return;
        }

        console.log("input", input);
        punch.editedTime = input;

        if (punch.editedTime.length >= 3) {
          punch.editedTime =
            punch.editedTime.slice(0, 2) +
            ":" +
            punch.editedTime.slice(2, punch.editedTime.length);
        }

        console.log("edited time", punch.editedTime);
      },
      onKeyPress: button => {
        switch (button) {
          case "{bksp}":
            if (backspaceClicks == 0) {
              punch.EditedTime = " ";
            }
            backspaceClicks++;
            return;
          case "{ampm}":
            return;
        }
      },
      layout: {
        default: ["1 2 3", "4 5 6", "7 8 9", "{ampm} 0 {bksp}"]
      },
      mergeDisplay: true,
      display: {
        "{bksp}": "⌫",
        "{ampm}": "AM/PM"
      },
      maxLength: {
        default: 4
      },
      useTouchEvents: true
    });

    console.log("keyboard", keyboard);
  };
}
