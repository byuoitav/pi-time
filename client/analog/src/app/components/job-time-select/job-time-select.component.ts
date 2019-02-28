import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild
} from "@angular/core";
import { MatDatepicker } from "@angular/material";

import { Employee } from "../../objects";

@Component({
  selector: "job-time-select",
  templateUrl: "./job-time-select.component.html",
  styleUrls: ["./job-time-select.component.scss"]
})
export class JobTimeSelectComponent implements OnInit {
  @Input() employee: Employee;
  @Output() change = new EventEmitter<Date>();

  @ViewChild("picker") private picker: MatDatepicker<Date>;

  min: Date = new Date();
  max: Date = new Date();
  selected: Date;

  // TODO date validation (only allow dates that have punches)
  // TODO date warnings

  constructor() {
    // for comparison
    this.min.setHours(0, 0, 0, 0);
    this.max.setHours(0, 0, 0, 0);

    // the furthest back ever allowed is two pay periods
    this.min.setDate(this.min.getDate() - 29);
  }

  ngOnInit() {
    setTimeout(() => {
      if (this.selected == null || this.selected === undefined) {
        this.picker.open();
      }
    }, 0);
  }

  addToDate(x: number) {
    if (this.selected == null || this.selected === undefined) {
      this.selected = new Date();
      return;
    }

    const d = new Date(
      this.selected.getFullYear(),
      this.selected.getMonth(),
      this.selected.getDate() + x
    );

    if (d < this.min) {
      d.setDate(d.getDate() - x);
    }

    if (d > this.max) {
      d.setDate(d.getDate() - x);
    }

    this.selected = d;
  }

  selectDate(d: Date) {
    this.selected = d;
    this.change.emit(this.selected);

    console.log("selected", this.selected);
    console.log("min", this.min);
    console.log("max", this.max);

    console.log("selected === min", this.selected === this.min);
    console.log("selected === max", this.selected === this.max);
  }
}
