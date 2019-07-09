import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";

import { Employee } from "../../objects";

@Component({
  selector: "date-select",
  templateUrl: "./date-select.component.html",
  styleUrls: ["./date-select.component.scss"]
})
export class DateSelectComponent implements OnInit {
  jobIdx: number;
  today: Date;
  viewMonth: number;
  viewYear: number;
  viewDays: Date[];

  MonthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]

  DayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]

  private _emp: BehaviorSubject<Employee>;
  get emp(): Employee {
    if (this._emp) {
      return this._emp.value;
    }

    return undefined;
  }

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.jobIdx = +params.get("job");
      console.log("jobidx", this.jobIdx);
    });

    this.route.data.subscribe(data => {
      this._emp = data.employee;

      console.log("day select job", this.emp.jobs[this.jobIdx]);
    });

    this.today = new Date();
    this.viewMonth = this.today.getMonth();
    this.viewYear = this.today.getFullYear();

    this.getViewDays();
  }

  goBack() {
    window.history.back();
  }

  canMoveMonthBack(): boolean {
    // return (this.viewMonth < this.today.getMonth())
    return true;
  }

  canMoveMonthForward(): boolean {
    return (this.viewMonth < this.today.getMonth())
  }

  moveMonthBack() {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }

    this.getViewDays();
  }

  moveMonthForward() {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }

    this.getViewDays();
  }

  selectDay = (idx: number) => {
    this.router.navigate(["./" + idx], { relativeTo: this.route });
  };

  selectRandomDay = () => {
    const max = this.emp.jobs[this.jobIdx].days.length - 1;
    this.selectDay(Math.floor(Math.random() * Math.floor(max)));
  };

  getViewDays() {
    this.viewDays = [];
    const lastDayOfLastMonth = new Date(this.viewYear, this.viewMonth, 0);
    const start = lastDayOfLastMonth.getDate() - lastDayOfLastMonth.getDay();
    const startDate = new Date(this.viewYear, this.viewMonth - 1, start);
    
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      d.setDate(startDate.getDate() + i);
      this.viewDays.push(d);
    }
  }

  dayHasException(day: Date): boolean {
    const empDay = this.emp.jobs[this.jobIdx].days.find(
      d => d.time.toDateString() === day.toDateString()
    );

    if (empDay != null) {
      return empDay.hasPunchException || empDay.hasWorkOrderException;
    } else {
      return false;
    }
  }

  dayHasPunch(day: Date): boolean {
    const empDay = this.emp.jobs[this.jobIdx].days.find(
      d => d.time.toDateString() === day.toDateString()
    );

    if (empDay != null) {
      return empDay.punches.length > 0
    } else {
      return false;
    }
  }
}
