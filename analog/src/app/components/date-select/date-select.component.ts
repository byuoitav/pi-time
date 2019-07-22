import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, BehaviorSubject } from "rxjs";

import { EmployeeRef } from "../../services/api.service";
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
  ];

  DayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }

    return undefined;
  }

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.jobIdx = +params.get("job");
      console.log("jobidx", this.jobIdx);
      this.getViewDays();
    });

    this.route.data.subscribe(data => {
      this._empRef = data.empRef;
      this._empRef.subject().subscribe(emp => {
        this.getViewDays();
      });

      console.log("day select job", this.emp.jobs[this.jobIdx]);
    });
  }

  goBack() {
    console.log("navigating");
    this.router.navigate(["../../../../../"], {
      relativeTo: this.route,
      queryParamsHandling: "preserve"
    });
  }

  canMoveMonthBack(): boolean {
    // return (this.viewMonth < this.today.getMonth())
    return true;
  }

  canMoveMonthForward(): boolean {
    return this.viewMonth < this.today.getMonth();
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

  selectDay = (day: Date) => {
    let idx = -1;
    for (let i = 0; i < this.emp.jobs[this.jobIdx].days.length; i++) {
      if (
        this.emp.jobs[this.jobIdx].days[i].time.toDateString() ===
        day.toDateString()
      ) {
        idx = i;
        break;
      }
    }

    if (idx != -1) {
      this.router.navigate(["./" + idx], { relativeTo: this.route });
    }
  };

  getViewDays() {
    this.today = new Date();

    this.viewMonth = this.today.getMonth();
    this.viewYear = this.today.getFullYear();

    this.viewDays = [];
    const lastDayOfLastMonth = new Date(this.viewYear, this.viewMonth, 0);
    const start = lastDayOfLastMonth.getDate() - lastDayOfLastMonth.getDay();
    const startDate = new Date(this.viewYear, this.viewMonth - 1, start);

    for (let i = 0; i < 42; i++) {
      const d = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );

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
      return empDay.punches.length > 0;
    } else {
      return false;
    }
  }

  logout = () => {
    this._empRef.logout();
  };
}
