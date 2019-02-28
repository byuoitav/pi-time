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
  public emp: Employee;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: APIService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.parent.data.subscribe((data: { employee: Employee }) => {
      console.log("hi from work orders", data);
      this.emp = data.employee;
    });
  }

  lunchPunch(j: Job) {}
}
