import {Component, OnInit, OnDestroy} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import Keyboard from "simple-keyboard";

import {EmployeeRef, APIService} from "../../services/api.service";
import {Employee, Day, JobType, Position, Punch} from "../../objects";
import {Subscription} from 'rxjs';

@Component({
  selector: "day-overview",
  templateUrl: "./day-overview.component.html",
  styleUrls: [
    "./day-overview.component.scss",
    "../../../../node_modules/simple-keyboard/build/css/index.css"
  ]
})
export class DayOverviewComponent implements OnInit, OnDestroy {
  public jobType = JobType;

  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }
    return undefined;
  }

  private _jobID: number;
  get job(): Position {
    if (this.emp) {
      return this.emp.positions.find(j => Number(j.positionNumber) === Number(this._jobID));
    }
    return undefined;
  }

  private _date: string;
  get day(): Day {
    if (this.job) {
      const date = new Date(this._date + " 00:00:00");
      let day: Day = this.job.days.find(
        d =>
          d.time.getFullYear() === date.getFullYear() &&
          d.time.getMonth() === date.getMonth() &&
          d.time.getDate() === date.getDate()
      );
      
      return day;
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

  private _subsToDestroy: Subscription[] = [];

  constructor(public api: APIService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {

    this._subsToDestroy.push(this.route.paramMap.subscribe(params => {
      if (params) {
        this._jobID = +params.get("jobid");
        this._date = params.get("date");
      }
    }));

    this._subsToDestroy.push(this.route.data.subscribe(data => {
      if (data) {
        this._empRef = data.empRef;
      }
    }));

    this._subsToDestroy.push(this.route.fragment.subscribe(frag => {
      if (frag) {
        this.selectedTab = frag;
      }
    }));
  }

  ngOnDestroy() {
    for (const s of this._subsToDestroy) {
      s.unsubscribe();
    }

    this._empRef = undefined;
    this._jobID = undefined;
    this._date = undefined;
    this._selectedTab = undefined;
  }

  goBack() {
    this.router.navigate(
      ["/employee/" + this.emp.id + "/job/" + this.job.positionNumber + "/date"],
      {
        preserveFragment: false,
        queryParamsHandling: "preserve"
      }
    );
  }

  logout = () => {
    this._empRef.logout(false);
  };

}


