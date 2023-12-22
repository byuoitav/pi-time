import {Component, OnInit, OnDestroy} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, BehaviorSubject, Subscription} from "rxjs";

import {EmployeeRef, APIService} from "../../services/api.service";
import {ToastService} from "../../services/toast.service";
import {Employee, Day, Position} from "../../objects";

@Component({
  selector: "date-select",
  templateUrl: "./date-select.component.html",
  styleUrls: ["./date-select.component.scss"]
})
export class DateSelectComponent implements OnInit, OnDestroy {
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

  private _jobID: number;
  Position: Position;
  get job(): Position {
    if (this.emp) {
      for (let i = 0; i < this.emp.positions.length; i++) {
        if (Number(this.emp.positions[i].positionNumber) === Number(this._jobID)) {
          return this.emp.positions[i];
        }
      }
    }
  
    return undefined;
  }

  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }
    return undefined;
  }

  private _subsToDestroy: Subscription[] = [];

  constructor(
    public api: APIService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this._subsToDestroy.push(this.route.paramMap.subscribe(params => {
      this._jobID = +params.get("jobid");
      this.getViewDays();
    }));

    this._subsToDestroy.push(this.route.data.subscribe(data => {
      this._empRef = data.empRef;

      this._subsToDestroy.push(this._empRef.subject().subscribe(emp => {
        if (this.job) {
          // this.minDay = Day.minDay(this.job.days);
          // this.maxDay = Day.maxDay(this.job.days);
        }

        this.getViewDays();
      }));
    }));
  }

  ngOnDestroy() {
    for (const s of this._subsToDestroy) {
      s.unsubscribe();
    }

    this._empRef = undefined;
  }

  goBack() {
    if (this.emp.positions.length > 1) {
      // job select
      this.router.navigate(["/employee/" + this.emp.id + "/job"], {
        queryParamsHandling: "preserve"
      });
    } else {
      // clock
      this.router.navigate(["/employee/" + this.emp.id], {
        queryParamsHandling: "preserve"
      });
    }
  }

  canMoveMonthBack(): boolean {
    return this.viewMonth >= this.today.getMonth();
  }

  canMoveMonthForward(): boolean {
    return this.viewMonth <= this.today.getMonth() && this.viewMonth !== 11;
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

  selectDay = (date: Date) => {
    console.log("CLICKED", date);
    const str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    console.log("str", str);
    this.router.navigate(["./" + str], {
      relativeTo: this.route,
      queryParamsHandling: "preserve"
    });
    if (!this.job) {
      console.warn("job", this._jobID, "is undefined for this employee");
      return;
    }

    const day = this.job.days.find(
      d =>
        d.time.getFullYear() === date.getFullYear() &&
        d.time.getMonth() === date.getMonth() &&
        d.time.getDate() === date.getDate()
    );

    //add cookie to know what current date they are looking at
    if (this._empRef) {
      this._empRef.selectedDate = date;
    }
  };

  getViewDays() {
    this.today = new Date();

    if (!this._empRef) {
      return;
    }

    if (!this.viewMonth) {
      if (this._empRef.selectedDate) {
        this.viewMonth = this._empRef.selectedDate.getMonth();
      } else {
        this.viewMonth = this.today.getMonth();
      }
    }

    if (!this.viewYear) {
      if (this._empRef.selectedDate) {
        this.viewYear = this._empRef.selectedDate.getFullYear();
      } else {
        this.viewYear = this.today.getFullYear();
      }
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

  dayHasPunch(day: Date): boolean {
    if (this.job) {
      const empDay = this.job.days.find(
        d => d.time.toDateString() === day.toDateString()
      );

      if (empDay) {
        return empDay.punches.length > 0;
      }
    }

    return false;
  }

  logout = () => {
    this._empRef.logout(false);
  };
}
