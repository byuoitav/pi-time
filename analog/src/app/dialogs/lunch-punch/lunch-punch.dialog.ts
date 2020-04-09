import {Component, OnInit, Inject, Injector, OnDestroy} from "@angular/core";
import {MatDialogRef, MAT_DIALOG_DATA} from "@angular/material";
import {ComponentPortal, PortalInjector} from "@angular/cdk/portal";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {Observable, of, Subscription} from "rxjs";

import {ToastService} from "src/app/services/toast.service";

import {TimeEntryComponent} from "../../components/time-entry/time-entry.component";
import {PORTAL_DATA} from "../../objects";
import {Router, NavigationStart} from "@angular/router";

@Component({
  selector: "lunch-punch-dialog",
  templateUrl: "./lunch-punch.dialog.html",
  styleUrls: ["./lunch-punch.dialog.scss"]
})
export class LunchPunchDialog implements OnInit {
  selectedStartTime: Date;
  selectedDuration: string;

  private _overlayRef: OverlayRef;

  constructor(
    public ref: MatDialogRef<LunchPunchDialog>,
    private _overlay: Overlay,
    private _injector: Injector,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      submit: (startTime: Date, duration: string) => Observable<any>;
    },
    private _toast: ToastService
  ) {
    // TODO make sure this subscription ends after one event?
    this.ref.afterClosed().subscribe(() => {
      // TODO make sure this actually runs. I haven't tested it as of now.
      this._overlayRef.detach();
      this._overlayRef.dispose();

      this._overlayRef = undefined;
    });
  }

  ngOnInit() {}

  cancel() {
    this.ref.close(true);
  }

  submit = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      console.log(
        "submitting lunch punch with start time of ",
        this.selectedStartTime,
        "and duration of ",
        this.selectedDuration
      );

      this.data.submit(this.selectedStartTime, this.selectedDuration).subscribe(
        data => {
          resolve(true);
        },
        err => {
          resolve(false);
        }
      );
    });
  };

  success = () => {
    this.ref.close();
    this._toast.show("Lunch Punch Recorded", "DISMISS", 2000);
  };

  editStartTime = () => {
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
      title: "Enter start time for lunch punch.",
      duration: false,
      save: (hours: string, mins: string, ampm: string): Observable<any> => {
        let h = Number(hours);
        const m = Number(mins);

        if (ampm === "AM" && h === 12) {
          h = 0;
        }

        if (ampm === "PM" && h != 12) {
          h += 12;
        }

        const date = new Date();
        date.setHours(h, m, 0, 0);

        this.selectedStartTime = date;
        return of(true);
      }
    });

    const portal = new ComponentPortal(TimeEntryComponent, null, injector);
    this._overlayRef.attach(portal);
  };

  editDuration = () => {
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
      title: "Enter duration of lunch punch.",
      duration: true,
      save: (hours: string, mins: string): Observable<any> => {
        if (hours) {
          this.selectedDuration = hours + ":" + mins;
        } else {
          this.selectedDuration = ":" + mins;
        }

        return of(true);
      }
    });

    const portal = new ComponentPortal(TimeEntryComponent, null, injector);
    this._overlayRef.attach(portal);
  };

  private createInjector = (
    overlayRef: OverlayRef,
    data: any
  ): PortalInjector => {
    const tokens = new WeakMap();

    tokens.set(OverlayRef, overlayRef);
    tokens.set(PORTAL_DATA, data);

    return new PortalInjector(this._injector, tokens);
  };
}
