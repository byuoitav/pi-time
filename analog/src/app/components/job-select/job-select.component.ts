import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";

import { EmployeeRef } from "../../services/api.service";
import { Employee } from "../../objects";

@Component({
  selector: "job-select",
  templateUrl: "./job-select.component.html",
  styleUrls: ["./job-select.component.scss"]
})
export class JobSelectComponent implements OnInit {
  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }

    return undefined;
  }

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this._empRef = data.empRef;

      this._empRef.observable().subscribe(emp => {
        if (emp && emp.jobs.length === 1) {
          this.selectJob(0);
        }
      });
    });
  }

  selectJob = (idx: number) => {
    console.log("selecting job", idx);
    this.router.navigate(["./" + idx + "/date/"], { relativeTo: this.route });
  };

  logout = () => {
    this._empRef.logout();
  };

  goBack() {
    window.history.back();
  }
}
