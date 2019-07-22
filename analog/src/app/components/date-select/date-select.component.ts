import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, BehaviorSubject } from "rxjs";

import { EmployeeRef } from "../../services/api.service";
import { Employee, Day } from "../../objects";

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

  minDay: Day;
  maxDay: Day;

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
      
    });

    this.route.data.subscribe(data => {
      this._empRef = data.empRef;
      this._empRef.subject().subscribe(emp => {
        this.minDay = Day.minDay(this.emp.jobs[this.jobIdx].days);
        this.maxDay = Day.maxDay(this.emp.jobs[this.jobIdx].days);

        console.log("minimum day", this.minDay);
        console.log("maximum day", this.maxDay);

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
    // if (this.minDay != null) {
    //   return this.viewMonth > this.minDay.time.getMonth();
    // }
    return this.viewMonth >= this.today.getMonth();
  }

  canMoveMonthForward(): boolean {
    // if (this.maxDay != null) {
    //   return this.viewMonth < (this.maxDay.time.getMonth() + 1);
    // }
    return this.viewMonth <= this.today.getMonth();
  }

  moveMonthBack() {
    console.log("moving month back...");
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }

    this.getViewDays();
  }

  moveMonthForward() {
    console.log("moving month forward...");
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

    if (this.viewMonth == null) {
      this.viewMonth = this.today.getMonth();
    }
    if (this.viewYear == null) {
      this.viewYear = this.today.getFullYear();
    }
    

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
