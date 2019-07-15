import {
  Component,
  OnInit,
  ViewEncapsulation,
  AfterViewInit
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import Keyboard from "simple-keyboard";

import { EmployeeRef } from "../../services/api.service";
import { Employee, Job, Day, PunchType, JobType } from "../../objects";

@Component({
  selector: "day-overview",
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./day-overview.component.html",
  styleUrls: [
    "./day-overview.component.scss",
    "../../../../node_modules/simple-keyboard/build/css/index.css"
  ]
})
export class DayOverviewComponent implements OnInit, AfterViewInit {
  private keyboard: Keyboard;

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

  ngAfterViewInit() {
    /*
    this.keyboard = new Keyboard({
      onChange: input => this.onChange(input),
      onKeyPress: button => this.onKeyPress(button),
      layout: {
        default: ["1 2 3", "4 5 6", "7 8 9", "0 {bksp}"]
      },
      mergeDisplay: true,
      display: {
        "{bksp}": "⌫"
      },
      maxLength: {
        default: 4
      },
      useTouchEvents: true
    });

    console.log("keyboard", this.keyboard);
    */
  }

  onChange = (input: string) => {
    // this.filterString = input;
    // this.filter();
  };

  onKeyPress = (button: string) => {};

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

  getExceptionCount() {
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

  jobIsFullTime() {
    if (this.job) {
      return this.job.jobType === JobType.FullTime;
    }
  }
}
