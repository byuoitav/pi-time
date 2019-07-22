import { Component, OnInit, Inject, Injector } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { Observable } from "rxjs";

import { WoSelectComponent } from "../../components/wo-select/wo-select.component";
import { Job, WorkOrder, TRC, PORTAL_DATA } from "../../objects";

@Component({
  selector: "wo-trc-dialog",
  templateUrl: "./wo-trc.dialog.html",
  styleUrls: ["./wo-trc.dialog.scss"]
})
export class WoTrcDialog implements OnInit {
  selectedWO: WorkOrder;
  selectedPay: string;
  hours: string;

  constructor(
    public ref: MatDialogRef<WoTrcDialog>,
    private _overlay: Overlay,
    private _injector: Injector,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      job: Job;
      title: string;
      showTRC: boolean;
      showWO: boolean;
      showHours: boolean;
      chosenWO?: WorkOrder;
      submit: (trc?: TRC, wo?: WorkOrder, hours?: string) => Observable<any>;
    }
  ) {
    if (data.chosenWO) {
      this.selectedWO = data.chosenWO;
    } else {
      this.selectedWO = data.job.currentWorkOrder;
    }
    
    this.selectedPay = data.job.currentTRC.id;
    this.hours = "";

    // default to regular pay (or whatever is first in the trc's array
    if (!this.selectedPay && data.job.trcs.length > 0) {
      this.selectedPay = data.job.trcs[0].id;
    }
  }

  ngOnInit() {}

  cancel() {
    this.ref.close(true);
  }

  submit = async (): Promise<boolean> => {
    // get the trc
    const trc = this.selectedPay
      ? this.data.job.trcs.find(t => t.id === this.selectedPay)
      : undefined;

    return new Promise<boolean>((resolve, reject) => {
      this.data.submit(trc, this.selectedWO, this.hours).subscribe(
        data => {
          console.log("sumbit data", data);
          resolve(true);
        },
        err => {
          console.error("sumbit error", err);
          resolve(false);
        }
      );
    });
  };

  selectWorkOrder = () => {
    const overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "wo-select-overlay"]
    });

    const injector = this.createInjector(overlayRef, {
      workOrders: this.data.job.workOrders,
      selectWorkOrder: (wo: WorkOrder) => {
        this.selectedWO = wo;
        overlayRef.dispose();
      }
    });

    const portal = new ComponentPortal(WoSelectComponent, null, injector);
    const containerRef = overlayRef.attach(portal);
    return overlayRef;
  };

  private createInjector(overlayRef: OverlayRef, data: any): PortalInjector {
    const tokens = new WeakMap();

    tokens.set(OverlayRef, overlayRef);
    tokens.set(PORTAL_DATA, data);

    return new PortalInjector(this._injector, tokens);
  }

  stopSubmit = (): boolean => {
    if (this.data.showTRC && (this.selectedPay == null || this.selectedPay.length == 0)) {
      return true;
    }
    if (this.data.showWO && (this.selectedWO == null)) {
      return true;
    }
    if (this.data.showHours && (this.hours == null || this.hours.length == 0)) {
      return true;
    }

    return false;
  }
}
