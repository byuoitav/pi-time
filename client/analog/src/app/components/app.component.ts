import { Component, OnInit } from "@angular/core";

import { APIService } from "../services/api.service";

@Component({
  selector: "clock",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  constructor(public api: APIService) {}

  ngOnInit() {}
}
