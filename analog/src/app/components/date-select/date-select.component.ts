import {Component, OnInit, OnDestroy} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, BehaviorSubject, Subscription} from "rxjs";

import {EmployeeRef, APIService} from "../../services/api.service";
import {ToastService} from "../../services/toast.service";
import {Employee, Job, Day, JobType} from "../../objects";

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
  get job(): Job {
    if (this.emp) {
      return this.emp.jobs.find(j => j.employeeJobID === this._jobID);
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
          this.minDay = Day.minDay(this.job.days);
          this.maxDay = Day.maxDay(this.job.days);
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
    if (this.emp.jobs.length > 1) {
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
    return this.viewMonth <= this.today.getMonth();
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
    if (!this.job) {
      console.warn("job", this._jobID, "is undefined for this employee");
      // TODO redirect to job select/error?
      return;
    }

    const str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

    const day = this.job.days.find(
      d =>
        d.time.getFullYear() === date.getFullYear() &&
        d.time.getMonth() === date.getMonth() &&
        d.time.getDate() === date.getDate()
    );

    if (!day && this.job.jobType !== JobType.FullTime) {
      this.toast.show(
        "No punches recorded for " + date.toDateString(),
        "DISMISS",
        1500
      );
      return;
    }

    //add cookie to know what current date they are looking at
    this._empRef.selectedDate = date;

    if (!day) {
      this.router.navigate(["./" + str], {
        relativeTo: this.route,
        fragment: "other-hours"
      });
    } else {
      if (day.hasWorkOrderException && !day.hasPunchException) {
        this.router.navigate(["./" + str], {
          relativeTo: this.route,
          fragment: "wo/sr"
        });
      } else {
        this.router.navigate(["./" + str], {relativeTo: this.route});
      }
    }
  };

  getViewDays() {
    this.today = new Date();

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

  dayHasException(day: Date): boolean {
    if (this.job) {
      const empDay = this.job.days.find(
        d => d.time.toDateString() === day.toDateString()
      );

      if (empDay) {
        return empDay.hasPunchException || empDay.hasWorkOrderException;
      }
    }

    return false;
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
    this._empRef.logout();
  };
}
