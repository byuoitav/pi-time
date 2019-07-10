import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { EmployeeRef } from "../../services/api.service";
import { Employee, Job, Day, PunchType } from "../../objects";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "day-overview",
  templateUrl: "./day-overview.component.html",
  styleUrls: ["./day-overview.component.scss"]
})
export class DayOverviewComponent implements OnInit {
  options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };

  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }

    return undefined;
  }

  get job(): Job {
    if (this.jobIdx >= 0 && this.emp) {
      return this.emp.jobs[this.jobIdx];
    }

    return undefined;
  }

  get day(): Day {
    if (this.dayIdx >= 0 && this.job) {
      return this.job.days[this.dayIdx];
    }

    return undefined;
  }

  public jobIdx: number;
  private dayIdx: number;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.jobIdx = +params.get("job");
      console.log("jobidx", this.jobIdx);

      this.dayIdx = +params.get("date");
      console.log("dayidx", this.dayIdx);
    });

    this.route.data.subscribe(data => {
      this._empRef = data.empRef;
    });
  }

  goBack() {
    window.history.back();
  }

  typeToString(type: string): string {
    switch (type) {
      case PunchType.In:
        return "IN";
      case PunchType.Out:
        return "OUT";
      default:
        return "";
    }
  }

  logout = () => {
    this._empRef.logout();
  };
}
