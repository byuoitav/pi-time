import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material";

import { APIService } from "../../services/api.service";
import { Employee, Job } from "../../objects";
import { ChangeWoDialog } from "../../dialogs/change-wo/change-wo.dialog";

@Component({
  selector: "jobs",
  templateUrl: "./jobs.component.html",
  styleUrls: ["./jobs.component.scss"]
})
export class JobsComponent implements OnInit {
  public emp: Employee;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: APIService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.parent.data.subscribe((data: { employee: Employee }) => {
      this.emp = data.employee;
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
}
