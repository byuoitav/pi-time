import { Component, OnInit, Input } from "@angular/core";

import { Day } from "../../objects";

@Component({
  selector: "wo-sr",
  templateUrl: "./wo-sr.component.html",
  styleUrls: [
    "./wo-sr.component.scss",
    "../day-overview/day-overview.component.scss"
  ]
})
export class WoSrComponent implements OnInit {
  @Input() day: Day;

  constructor() {}

  ngOnInit() {}
}
