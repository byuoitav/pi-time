import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { Job, WorkOrder } from "../../objects";

@Component({
  selector: "change-wo",
  templateUrl: "./change-wo.dialog.html",
  styleUrls: ["./change-wo.dialog.scss"]
})
export class ChangeWoDialog implements OnInit {
  workOrders: Array<WorkOrder> = new Array<WorkOrder>();

  constructor(
    public ref: MatDialogRef<ChangeWoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { job: Job }
  ) {
    this.selectedWO = data.job.currentWorkOrder;

    // build work orders list
    this.workOrders.push(data.job.currentWorkOrder);
    this.workOrders.push(...data.job.availableWorkOrders);

    // build 

    console.log("work orders", this.workOrders);
  }

  ngOnInit() {}

  onNoClick() {
    console.log("selected", this.selectedWO);
    this.ref.close();
  }
}
