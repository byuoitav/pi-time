import {
  Component,
  OnInit,
  Inject,
  ViewEncapsulation,
  AfterViewInit
} from "@angular/core";
import { OverlayRef } from "@angular/cdk/overlay";
import Keyboard from "simple-keyboard";

import { WorkOrder, PORTAL_DATA } from "../../objects";

@Component({
  selector: "wo-select",
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./wo-select.component.html",
  styleUrls: [
    "./wo-select.component.scss",
    "../../../../node_modules/simple-keyboard/build/css/index.css"
  ]
})
export class WoSelectComponent implements OnInit, AfterViewInit {
  public filterString = "";
  public filtered: WorkOrder[] = [];

  private keyboard: Keyboard;

  constructor(
    private ref: OverlayRef,
    @Inject(PORTAL_DATA)
    private data: {
      workOrders: WorkOrder[];
      selectWorkOrder: (WorkOrder) => void;
    }
  ) {
    this.filter();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.keyboard = new Keyboard({
      onChange: input => this.onChange(input),
      onKeyPress: button => this.onKeyPress(button),
      layout: {
        default: [
          "1 2 3 4 5 6 7 8 9 0",
          "q w e r t y u i o p",
          "a s d f g h j k l",
          "z x c v {space} b n m {bksp}"
        ]
      },
      mergeDisplay: true,
      display: {
        "{bksp}": "⌫",
        "{space}": "space"
      },
      buttonTheme: [
        {
          class: "keyboard-tall-button",
          buttons:
            "1 2 3 4 5 6 7 8 9 0 q w e r t y u i o p a s d f g h j k l z x c v b n m {bksp} {space}"
        }
      ]
    });
  }

  onChange = (input: string) => {
    this.filterString = input;
    this.filter();
  };

  onKeyPress = (button: string) => {};

  onInputChange = (event: any) => {
    this.keyboard.setInput(event.target.value);
  };

  filter = () => {
    this.filtered = this.data.workOrders.filter(wo => {
      // everything matches the empty string
      if (!this.filterString) {
        return true;
      }

      const datastr = Object.keys(wo)
        .reduce((term: string, key: string) => {
          if (!wo[key]) {
            return term;
          }

          return term + (wo as { [key: string]: any })[key] + "◬";
        }, "")
        .toLowerCase();

      return datastr.includes(this.filterString);
    });
  };

  cancel = () => {
    this.ref.dispose();
  };
}
