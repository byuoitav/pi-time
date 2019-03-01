import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material";

import { APIService } from "../../services/api.service";
import { Employee, Job } from "../../objects";

@Component({
  selector: "work-orders",
  templateUrl: "./work-orders.component.html",
  styleUrls: ["./work-orders.component.scss"]
})
export class WorkOrdersComponent implements OnInit {
  emp: Employee;
  jobs: Array<Job> = new Array<Job>();
  job: Job;

  minDate: Date;
  maxDate: Date;
  date: Date;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: APIService,
    public dialog: MatDialog
  ) {
    this.maxDate = new Date();
    this.minDate = new Date();
  }

  ngOnInit() {
    this.route.parent.data.subscribe((data: { employee: Employee }) => {
      console.log("hi from work orders", data);
      this.emp = data.employee;

      // build jobs list
      for (const job of this.emp.jobs) {
        for (const day of job.days) {
          if (day.workOrderBillings.length > 0) {
            this.jobs.push(job);
            break;
          }
        }
      }

      if (this.jobs.length == 1) {
        this.job = this.jobs[0];
      }

      // build valid dates list
    });

    this.date = new Date();
    this.minDate.setDate(this.minDate.getDate() - 29);
  }

  validDate = (d: Date): boolean => {
    for (const day of this.job.days) {
      if (d.getDate() === day.time.getDate()) {
        return true;
      }
    }

    return false;
  };

  lunchPunch(j: Job) {}
}
