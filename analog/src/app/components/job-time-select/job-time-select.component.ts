import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild
} from "@angular/core";
import { MatDatepicker } from "@angular/material";

import { Employee, Job, Day } from "../../objects";

@Component({
  selector: "job-time-select",
  templateUrl: "./job-time-select.component.html",
  styleUrls: ["./job-time-select.component.scss"]
})
export class JobTimeSelectComponent implements OnInit {
  @Input() min: Date = new Date();
  @Input() max: Date = new Date();
  @Input() jobs: Array<Job> = new Array<Job>();

  @Input() valid: (date: Date | null) => boolean;

  @Input()
  get day() {
    return this.dayVal;
  }
  set day(val) {
    this.dayVal = val;
    this.dayChange.emit(this.dayVal);
  }
  private dayVal: Day;
  @Output() private dayChange = new EventEmitter<Day>();

  get date() {
    return this.dateVal;
  }
  set date(val) {
    if (this.isDateValid(val)) {
      this.dateVal = val;
    }
  }
  private dateVal: Date;

  job: Job;

  // the currently selected date
  //@Input()
  //get date() {
  //  return this.dateVal;
  //}
  //set date(val) {
  //  if (val < this.min || val > this.max) {
  //    return;
  //  }

  //  this.dateVal = val;
  //  this.dateChange.emit(this.dateVal);
  //}
  //private dateVal: Date;
  //@Output() private dateChange = new EventEmitter<Date>();

  //// the currently selected job
  //@Input()
  //get job() {
  //  return this.jobVal;
  //}
  //set job(val) {
  //  this.jobVal = val;
  //  this.jobChange.emit(this.jobVal);
  //}
  //private jobVal: Job;
  //@Output() private jobChange = new EventEmitter<Job>();

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
      // loop from max -> min to get the first valid date
      const cur = this.max;
      while (cur >= this.min) {
        if (this.isDateValid(cur)) {
          this.date = cur;
          break;
        }

        cur.setDate(cur.getDate() - 1);
      }
    }

    setTimeout(() => {
      this.picker.open();
    }, 0);
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

  nextValidDate(d: Date): Date {
    const cur = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (cur >= this.max) {
      return undefined;
    }

    cur.setDate(cur.getDate() + 1);

    while (cur <= this.max) {
      if (this.isDateValid(cur)) {
        console.log("valid date", cur);
        return cur;
      }

      cur.setDate(cur.getDate() + 1);
    }

    return undefined;
  }

  prevValidDate(d: Date): Date {
    const cur = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (cur <= this.min) {
      return undefined;
    }

    cur.setDate(cur.getDate() - 1);

    while (cur >= this.min) {
      if (this.isDateValid(cur)) {
        return cur;
      }

      cur.setDate(cur.getDate() - 1);
    }

    return undefined;
  }
}
