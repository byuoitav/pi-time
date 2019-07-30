import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";

import { EmployeeRef, APIService } from "../../services/api.service";
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

  constructor(private route: ActivatedRoute, private router: Router, public api: APIService) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this._empRef = data.empRef;

      this._empRef.subject().subscribe(emp => {
        if (emp && emp.jobs.length === 1) {
          this.selectJob(0);
        }
      });
    });
  }

  selectJob = (jobID: number) => {
    this.router.navigate(["./" + jobID + "/date/"], { relativeTo: this.route });
  };

  logout = () => {
    this._empRef.logout();
  };

  goBack() {
    this.router.navigate(["/employee/" + this.emp.id], {
      queryParamsHandling: "preserve"
    });
  }

  hasTimesheetException = () => {
    if (
      this.emp.jobs.some(j =>
        j.days.some(d => d.hasPunchException || d.hasWorkOrderException)
      )
    ) {
      return "!";
    }

    return "";
  };
}
