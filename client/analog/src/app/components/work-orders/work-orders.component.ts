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
    });

    this.date = new Date();
    this.minDate.setDate(this.minDate.getDate() - 29);
  }

  validDate = (d: Date): boolean => {
    return false;
  };

  lunchPunch(j: Job) {}
}
