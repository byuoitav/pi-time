import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import Keyboard from "simple-keyboard";

import { EmployeeRef } from "../../services/api.service";
import { Employee, Job, Day, JobType } from "../../objects";

@Component({
  selector: "day-overview",
  templateUrl: "./day-overview.component.html",
  styleUrls: [
    "./day-overview.component.scss",
    "../../../../node_modules/simple-keyboard/build/css/index.css"
  ]
})
export class DayOverviewComponent implements OnInit {
  public jobType = JobType;

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

  logout = () => {
    this._empRef.logout();
  };

  getPunchExceptionCount() {
    if (this.day == undefined) {
      return "";
    } else if (this.day.hasPunchException) {
      let count = 0;
      for (const p of this.day.punches) {
        if (p.time == undefined) {
          count++;
        }
      }
      return String(count);
    }
  }

  getWOExceptionCount() {
    if (this.day === undefined) {
      return "";
    } else {
      if (this.day.hasWorkOrderException) {
        let count = 0;
        for (const w of this.day.workOrderEntries) {
          if (w.hoursBilled == undefined) {
            count++;
          }
        }
        return String(count);
      }
    }
  }
}
