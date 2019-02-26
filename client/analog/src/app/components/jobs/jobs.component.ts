import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { APIService } from "../../services/api.service";
import { Employee } from "../../objects";

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
    private api: APIService
  ) {}

  ngOnInit() {
    this.route.parent.data.subscribe((data: { employee: Employee }) => {
      console.log("hi from jobs", data);
      this.emp = data.employee;
    });
  }
}
