import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { Employee, Job, Day } from "../../objects";

@Component({
  selector: "day-overview",
  templateUrl: "./day-overview.component.html",
  styleUrls: ["./day-overview.component.scss"]
})
export class DayOverviewComponent implements OnInit {
  public emp: Employee;

  private _job: Job;
  get job(): Job {
    if (this.jobIdx && this.emp) {
      return this.emp.jobs[this.jobIdx];
    }

    return undefined;
  }

  private _day: Day;
  get day(): Day {
    if (this.dayIdx && this.job) {
      return this.job.days[this.dayIdx];
    }

    return undefined;
  }

  private jobIdx: number;
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
      this.emp = data.employee;
      console.log("employee", this.emp);
    });
  }
}
