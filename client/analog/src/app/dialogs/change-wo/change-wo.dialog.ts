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
  payTypes: Array<string> = new Array<string>();

  selectedWO: WorkOrder;
  selectedPay: string;

  constructor(
    public ref: MatDialogRef<ChangeWoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { job: Job }
  ) {
    this.selectedWO = data.job.currentWorkOrder;

    // build work orders list
    this.workOrders.push(data.job.currentWorkOrder);
    this.workOrders.push(...data.job.availableWorkOrders);

    // build pay types list
    this.payTypes.push(...data.job.payTypes);

    console.log("work orders", this.workOrders);
  }

  ngOnInit() {}

  onNoClick() {
    console.log("selected", this.selectedWO);
    this.ref.close();
  }
}
