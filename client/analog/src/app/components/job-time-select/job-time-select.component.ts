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
  @Input() min: Date = new Date();
  @Input() max: Date = new Date();

  @Input() valid: (date: Date | null) => boolean;

  // two-way binding to date
  @Input()
  get date() {
    this.dateVal = this.dateVal;
    return this.dateVal;
  }
  set date(val) {
    if (val < this.min || val > this.max) {
      return;
    }

    this.dateVal = val;
    this.dateChange.emit(this.dateVal);
  }
  private dateVal: Date;
  private dateChange = new EventEmitter<Date>();

  // TODO date validation (only allow dates that have punches)
  // TODO date warnings
  @ViewChild("picker") private picker: MatDatepicker<Date>;

  constructor() {
    // for comparison
    this.min.setHours(0, 0, 0, 0);
    this.max.setHours(0, 0, 0, 0);
  }

  ngOnInit() {
    if (this.date == null || this.date === undefined) {
      this.dateVal = new Date();
    }

    setTimeout(() => {
      this.picker.open();
    }, 5000);
  }

  // use => to keep this context
  isDateValid = (d: Date): boolean => {
    if (d < this.min || d > this.max) {
      return false;
    }

    if (this.valid != null && this.valid !== undefined) {
      return this.valid(d);
    }

    return true;
  };

  // TODO this should probably be a function like getnextdec/getnextinc
  addToDate(x: number): Date {
    return new Date(
      this.date.getFullYear(),
      this.date.getMonth(),
      this.date.getDate() + x
    );
  }
}
