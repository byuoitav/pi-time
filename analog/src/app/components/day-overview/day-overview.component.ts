import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import Keyboard from "simple-keyboard";

import { EmployeeRef, APIService } from "../../services/api.service";
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

  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }

    return undefined;
  }

  private _jobID: number;
  get job(): Job {
    if (this.emp) {
      return this.emp.jobs.find(j => j.employeeJobID === this._jobID);
    }

    return undefined;
  }

  private _date: string;
  get day(): Day {
    console.log("Hello World");
    if (this.job) {
      const date = new Date(this._date + " 00:00:00");
      return this.job.days.find(
        d =>
          d.time.getFullYear() === date.getFullYear() &&
          d.time.getMonth() === date.getMonth() &&
          d.time.getDate() === date.getDate()
      );
    }

    return undefined;
  }

  private _selectedTab: string;
  get selectedTab(): string | number {
    switch (this._selectedTab) {
      case "punches":
        return 0;
      case "wo/sr":
        return 1;
      case "other-hours":
        return 2;
      default:
        return undefined;
    }
  }

  set selectedTab(tab: string | number) {
    if (typeof tab === "number") {
      switch (tab) {
        case 0:
          tab = "punches";
          break;
        case 1:
          tab = "wo/sr";
          break;
        case 2:
          tab = "other-hours";
          break;
        default:
          tab = "punches";
          break;
      }
    }

    this._selectedTab = tab;

    this.router.navigate([], {
      queryParamsHandling: "preserve",
      fragment: this._selectedTab
    });
  }

  constructor(public api: APIService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (params) {
        this._jobID = +params.get("jobid");
        this._date = params.get("date");
      }
    });

    this.route.data.subscribe(data => {
      if (data) {
        this._empRef = data.empRef;
      }
    });

    this.route.fragment.subscribe(frag => {
      if (frag) {
        this.selectedTab = frag;
      }
    });
  }

  goBack() {
    this.router.navigate(
      ["/employee/" + this.emp.id + "/job/" + this.job.employeeJobID + "/date"],
      {
        preserveFragment: false,
        queryParamsHandling: "preserve"
      }
    );
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
        let count = 1;
        return String(count);
      }
    }
  }
}
