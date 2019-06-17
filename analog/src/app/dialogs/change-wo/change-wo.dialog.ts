import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { Job, WorkOrder, TRC } from "../../objects";

@Component({
  selector: "change-wo",
  templateUrl: "./change-wo.dialog.html",
  styleUrls: ["./change-wo.dialog.scss"]
})
export class ChangeWoDialog implements OnInit {
  workOrders: Array<WorkOrder> = new Array<WorkOrder>();
  payTypes: Array<TRC> = new Array<TRC>();

  selectedWO: WorkOrder;
  selectedPay: string;

  constructor(
    public ref: MatDialogRef<ChangeWoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { job: Job }
  ) {
    this.selectedWO = data.job.currentWorkOrder;

    // build work orders list
    this.workOrders.push(data.job.currentWorkOrder);
    this.workOrders.push(...data.job.workOrders);

    // build pay types list
    this.payTypes.push(...data.job.trcs);

    console.log("work orders", this.workOrders);
  }

  ngOnInit() {}

  onNoClick() {
    console.log("selected", this.selectedWO);
    this.ref.close();
  }
}
