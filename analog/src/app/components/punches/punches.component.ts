import { Component, OnInit, Input, ViewEncapsulation } from "@angular/core";
import Keyboard from "simple-keyboard";

import { Day, PunchType, Punch } from "../../objects";
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

  @Input() day: Day;
  keyboardOpen = false;

  constructor() {}

  ngOnInit() {}

  openKeyboard = (punch: Punch, event: MouseEvent) => {
    if (this.keyboardOpen) {
      return;
    }

    this.keyboardOpen = true;
    const element = event.srcElement;
    element.classList.add("editing");

    const keyboard = new Keyboard({
      onChange: input => {
        if (input.length > 4) {
          return;
        }

        punch.editedTime = input;

        if (!this.validEditTime(punch)) {
          keyboard.addButtonTheme("{done}", "keyboard-button-disabled");
        } else {
          keyboard.removeButtonTheme("{done}", "keyboard-button-disabled");
        }
      },
      onKeyPress: button => {
        switch (button) {
          case "{ampm}":
            switch (punch.editedAMPM) {
              case "PM":
                punch.editedAMPM = "AM";
                return;
              case "AM":
                punch.editedAMPM = "PM";
                return;
              default:
                punch.editedAMPM = "AM";
                return;
            }
          case "{done}":
            element.classList.remove("editing");

            if (!punch.editedTime || punch.editedTime.includes("--:--")) {
              punch.editedAMPM = undefined;
            }

            keyboard.destroy();
            this.keyboardOpen = false;
            return;
          case "{cancel}":
            element.classList.remove("editing");

            punch.editedTime = undefined;
            punch.editedAMPM = undefined;

            keyboard.destroy();
            this.keyboardOpen = false;
            return;
        }
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

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center"
    });
  };

  punchTime = (punch: Punch): string => {
    if (punch.time) {
      let hours = punch.time.getHours();
      let minutes = punch.time.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";

      hours = hours % 12;
      const minutesStr = minutes < 10 ? "0" + minutes : minutes;

      return hours + ":" + minutesStr + " " + ampm;
    }

    if (punch.editedTime) {
      const time =
        punch.editedTime.length >= 3
          ? punch.editedTime.slice(0, 1) +
            ":" +
            punch.editedTime.slice(1, punch.editedTime.length)
          : punch.editedTime;

      if (punch.editedAMPM) {
        return time + " " + punch.editedAMPM;
      }

      return time;
    }

    if (punch.editedAMPM) {
      return "--:-- " + punch.editedAMPM;
    }

    return "--:--";
  };

  validEditTime = (punch: Punch): boolean => {
    if (
      !punch.editedTime ||
      punch.editedTime.length < 3 ||
      punch.editedTime.length > 4
    ) {
      return false;
    }

    const hourStr =
      punch.editedTime.length === 3
        ? punch.editedTime.charAt(0)
        : punch.editedTime.slice(0, 2);

    console.log("editedTime", punch.editedTime);

    const minStr =
      punch.editedTime.length === 3
        ? punch.editedTime.slice(2, 3)
        : punch.editedTime.slice(2, 4);

    console.log("hourstr:", hourStr, "minstr:", minStr);

    const pmOffset = punch.editedAMPM === "PM" ? 12 : 0;
    return true;
  };
}
