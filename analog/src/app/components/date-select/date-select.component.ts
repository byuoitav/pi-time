import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { Employee } from "../../objects";

@Component({
  selector: "date-select",
  templateUrl: "./date-select.component.html",
  styleUrls: ["./date-select.component.scss"]
})
export class DateSelectComponent implements OnInit {
  jobIdx: number;
  emp: Employee;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.jobIdx = +params.get("job");
      console.log("jobidx", this.jobIdx);
    });

    this.route.data.subscribe(data => {
      console.log("day select data", data);
      this.emp = data.employee;
      console.log("day select job", data.employee.jobs[this.jobIdx]);
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
