import { Component, OnInit, Input } from "@angular/core";

import { Day } from "../../objects";

@Component({
  selector: "sick-vacation",
  templateUrl: "./sick-vacation.component.html",
  styleUrls: [
    "./sick-vacation.component.scss",
    "../day-overview/day-overview.component.scss"
  ]
})
export class SickVacationComponent implements OnInit {
  @Input() day: Day;

  constructor() {}

  ngOnInit() {}
}
