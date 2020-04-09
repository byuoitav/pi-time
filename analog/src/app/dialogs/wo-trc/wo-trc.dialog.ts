import {Component, OnInit, Inject, Injector} from "@angular/core";
import {MatDialogRef, MAT_DIALOG_DATA} from "@angular/material";
import {ComponentPortal, PortalInjector} from "@angular/cdk/portal";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {BehaviorSubject, Observable, of, Subscription} from "rxjs";

import {WoSelectComponent} from "../../components/wo-select/wo-select.component";
import {TimeEntryComponent} from "../../components/time-entry/time-entry.component";
import {Job, WorkOrder, TRC, PORTAL_DATA} from "../../objects";

@Component({
  selector: "wo-trc-dialog",
  templateUrl: "./wo-trc.dialog.html",
  styleUrls: ["./wo-trc.dialog.scss"]
})
export class WoTrcDialog implements OnInit {
  selectedWO: WorkOrder;
  selectedPay: string;
  hours: string;

  get job() {
    if (this.data.jobRef instanceof BehaviorSubject) {
      return this.data.jobRef.value;
    }

    return this.data.jobRef;
  }

  get showWO(): Boolean {
    if (this.data.showWO instanceof BehaviorSubject) {
      return this.data.showWO.value;
    }

    return this.data.showWO;
  }

  get showTRC(): Boolean {
    if (this.data.showTRC instanceof BehaviorSubject) {
      return this.data.showTRC.value;
    }

    return this.data.showTRC;
  }

  get showHours(): Boolean {
    if (this.data.showHours instanceof BehaviorSubject) {
      return this.data.showHours.value;
    }

    return this.data.showHours;
  }

  private _overlayRef: OverlayRef;

  constructor(
    public ref: MatDialogRef<WoTrcDialog>,
    private _overlay: Overlay,
    private _injector: Injector,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      jobRef: Job | BehaviorSubject<Job>;
      title: string;
      showTRC: boolean | BehaviorSubject<Boolean>;
      showWO: boolean | BehaviorSubject<Boolean>;
      showHours: boolean | BehaviorSubject<Boolean>;
      chosenWO?: WorkOrder;
      submit: (trc?: TRC, wo?: WorkOrder, hours?: string) => Observable<any>;
      delete: () => Observable<any>;
    }
  ) {
    // TODO make sure this subscription ends after one event?
    this.ref.afterClosed().subscribe(() => {
      // TODO make sure this actually runs. I haven't tested it as of now.
      this._overlayRef.detach();
      this._overlayRef.dispose();

      this._overlayRef = undefined;
    });

    if (data.chosenWO) {
      this.selectedWO = data.chosenWO;
    }

    this.hours = "";

    if (this.job) {
      if (!data.chosenWO) {
        this.selectedWO = this.job.currentWorkOrder;
      }

      this.selectedPay = this.job.currentTRC.id;

      // default to regular pay (or whatever is first in the trc's array
      if (!this.selectedPay && this.job.trcs.length > 0) {
        this.selectedPay = this.job.trcs[0].id;
      }
    }
  }

  ngOnInit() {}

  cancel() {
    this.ref.close(true);
  }

  submit = async (): Promise<boolean> => {
    // get the trc
    const trc = this.selectedPay
      ? this.job.trcs.find(t => t.id === this.selectedPay)
      : undefined;

    return new Promise<boolean>((resolve, reject) => {
      this.data.submit(trc, this.selectedWO, this.hours).subscribe(
        data => {
          resolve(true);
        },
        err => {
          resolve(false);
        }
      );
    });
  };

  delete = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      this.data.delete().subscribe(
        data => {
          resolve(true);
        },
        err => {
          resolve(false);
        }
      );
    });
  };

  selectWorkOrder = () => {
    // if one is already open, close it
    if (this._overlayRef) {
      this._overlayRef.detach();
      this._overlayRef.dispose();
      this._overlayRef = undefined;
    }

    this._overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "wo-select-overlay"]
    });

    const injector = this.createInjector(this._overlayRef, {
      workOrders: this.job.workOrders,
      selectWorkOrder: (wo: WorkOrder) => {
        this.selectedWO = wo;
        this._overlayRef.dispose();
      }
    });

    const portal = new ComponentPortal(WoSelectComponent, null, injector);
    this._overlayRef.attach(portal);
  };

  private createInjector(overlayRef: OverlayRef, data: any): PortalInjector {
    const tokens = new WeakMap();

    tokens.set(OverlayRef, overlayRef);
    tokens.set(PORTAL_DATA, data);

    return new PortalInjector(this._injector, tokens);
  }

  stopSubmit = (): boolean => {
    if (
      this.showTRC &&
      (this.selectedPay == null || this.selectedPay.length == 0)
    ) {
      return true;
    }
    if (this.showWO && this.selectedWO == null) {
      return true;
    }
    if (this.showHours && (this.hours == null || this.hours.length == 0)) {
      return true;
    }

    return false;
  };

  openHourEdit = () => {
    // if one is already open, close it
    if (this._overlayRef) {
      this._overlayRef.detach();
      this._overlayRef.dispose();
      this._overlayRef = undefined;
    }

    this._overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "time-entry-overlay"]
    });

    const injector = this.createInjector(this._overlayRef, {
      title: "Enter time for work order.",
      duration: true,
      save: (hours: string, mins: string): Observable<any> => {
        if (hours) {
          this.hours = hours + ":" + mins;
        } else {
          this.hours = ":" + mins;
        }

        return of(true); // TODO is there a better way...?
      },
      error: () => {}
    });

    const portal = new ComponentPortal(TimeEntryComponent, null, injector);
    this._overlayRef.attach(portal);
  };
}
