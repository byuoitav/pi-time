import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";

import { Employee } from "../../objects";

@Component({
  selector: "date-select",
  templateUrl: "./date-select.component.html",
  styleUrls: ["./date-select.component.scss"]
})
export class DateSelectComponent implements OnInit {
  jobIdx: number;

  private _emp: BehaviorSubject<Employee>;
  get emp(): Employee {
    if (this._emp) {
      return this._emp.value;
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
      this._emp = data.employee;

      console.log("day select job", this.emp.jobs[this.jobIdx]);
    });
  }

  selectDay = (idx: number) => {
    this.router.navigate(["./" + idx], { relativeTo: this.route });
  };

  selectRandomDay = () => {
    const max = this.emp.jobs[this.jobIdx].days.length - 1;
    this.selectDay(Math.floor(Math.random() * Math.floor(max)));
  };
}
