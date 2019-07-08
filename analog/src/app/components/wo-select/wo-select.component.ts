import { Component, OnInit, Inject } from "@angular/core";

import { WorkOrder, PORTAL_DATA } from "../../objects";

@Component({
  selector: "wo-select",
  templateUrl: "./wo-select.component.html",
  styleUrls: ["./wo-select.component.scss"]
})
export class WoSelectComponent implements OnInit {
  constructor(@Inject(PORTAL_DATA) public workOrders: WorkOrder[]) {
    console.log("work orders", this.workOrders);
  }

  ngOnInit() {}
}
