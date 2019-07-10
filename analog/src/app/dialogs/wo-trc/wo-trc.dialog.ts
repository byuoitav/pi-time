import { Component, OnInit, Inject, Injector } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";

import { WoSelectComponent } from "../../components/wo-select/wo-select.component";
import { Job, WorkOrder, TRC, PORTAL_DATA } from "../../objects";

@Component({
  selector: "wo-trc-dialog",
  templateUrl: "./wo-trc.dialog.html",
  styleUrls: ["./wo-trc.dialog.scss"]
})
export class WoTrcDialog implements OnInit {
  selectedWO: WorkOrder;
  selectedPay: TRC;

  constructor(
    public ref: MatDialogRef<WoTrcDialog>,
    private _overlay: Overlay,
    private _injector: Injector,
    @Inject(MAT_DIALOG_DATA) public job: Job
  ) {
    this.selectedWO = job.currentWorkOrder;
    this.selectedPay = job.currentTRC;

    // default to regular pay (or whatever is first in the trc's array
    if (
      (!this.selectedPay || this.selectedPay.id.length === 0) &&
      job.trcs.length > 0
    ) {
      this.selectedPay = job.trcs[0];
    }
  }

  ngOnInit() {}

  onNoClick() {
    console.log("selected", this.selectedWO);
    this.ref.close();
  }

  selectWorkOrder = () => {
    const overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "wo-select-overlay"]
    });

    const portal = new ComponentPortal(
      WoSelectComponent,
      null,
      this.createInjector(overlayRef, this.job.workOrders)
    );

    const containerRef = overlayRef.attach(portal);
    return overlayRef;
  };

  private createInjector(overlayRef: OverlayRef, data: any): PortalInjector {
    const tokens = new WeakMap();

    tokens.set(OverlayRef, overlayRef);
    tokens.set(PORTAL_DATA, data);

    return new PortalInjector(this._injector, tokens);
  }
}
