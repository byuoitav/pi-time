import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material";

import { APIService } from "../../services/api.service";
import { Employee, Job } from "../../objects";
import { ChangeWoDialog } from "../../dialogs/change-wo/change-wo.dialog";

@Component({
  selector: "jobs",
  templateUrl: "./clock.component.html",
  styleUrls: ["./clock.component.scss"]
})
export class ClockComponent implements OnInit {
  public emp: Employee;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: APIService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.emp = data.employee;
      this.emp.jobs.length = 1;
      console.log("employee", this.emp);
    });
  }

  selectWo(j: Job) {
    const ref = this.dialog.open(ChangeWoDialog, {
      width: "40vw",
      data: {
        job: j
      }
    });

    ref.afterClosed().subscribe(result => {
      console.log("closed with result", result);
    });
  }

  toTimesheet = () => {
    console.log("going to job select");
    this.router.navigate(["./job/"], { relativeTo: this.route });
  };
}
