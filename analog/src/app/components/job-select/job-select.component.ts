import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "job-select",
  templateUrl: "./job-select.component.html",
  styleUrls: ["./job-select.component.scss"]
})
export class JobSelectComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      console.log("job select data", data);
      data.employee.jobs.length = 1;

      if (data.employee && data.employee.jobs.length === 1) {
        this.selectJob(0);
      }
    });
  }

  selectJob = (idx: number) => {
    console.log("selecting job", idx);
    this.router.navigate(["./" + idx + "/date/"], { relativeTo: this.route });
  };
}
