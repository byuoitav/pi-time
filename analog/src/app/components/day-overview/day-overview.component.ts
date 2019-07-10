import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { Employee, Job, Day } from "../../objects";
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: "day-overview",
  templateUrl: "./day-overview.component.html",
  styleUrls: ["./day-overview.component.scss"]
})
export class DayOverviewComponent implements OnInit {
  options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  private _emp: BehaviorSubject<Employee>;
  get emp(): Employee {
    if (this._emp) {
      return this._emp.value;
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
      this._emp = data.employee;
      console.log("employee", this.emp);
    });
  }

  goBack() {
    window.history.back();
  }

  typeToString(type: string): string {
    if (type === "I") {
      return "IN";
    }
    if (type === "O") {
      return "OUT";
    }
  }
}
