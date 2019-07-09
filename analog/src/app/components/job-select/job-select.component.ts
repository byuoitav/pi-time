import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";

import { Employee } from "../../objects";

@Component({
  selector: "job-select",
  templateUrl: "./job-select.component.html",
  styleUrls: ["./job-select.component.scss"]
})
export class JobSelectComponent implements OnInit {
  private _emp: BehaviorSubject<Employee>;
  get emp(): Employee {
    if (this._emp) {
      return this._emp.value;
    }

    return undefined;
  }

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this._emp = data.employee;

      if (this.emp && this.emp.jobs.length === 1) {
        this.selectJob(0);
      }
    });
  }

  selectJob = (idx: number) => {
    console.log("selecting job", idx);
    this.router.navigate(["./" + idx + "/date/"], { relativeTo: this.route });
  };
}
