import { Component, OnInit, Input } from "@angular/core";

import { Punch, PunchType } from "../../objects";

@Component({
  selector: "punches",
  templateUrl: "./punches.component.html",
  styleUrls: [
    "./punches.component.scss",
    "../day-overview/day-overview.component.scss"
  ]
})
export class PunchesComponent implements OnInit {
  public punchType = PunchType;

  @Input() punches: Punch[] = [];

  constructor() {}

  ngOnInit() {}
}
