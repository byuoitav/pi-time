import { Component, OnInit, Inject, Injector } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { Observable, of } from "rxjs";

import { ToastService } from "src/app/services/toast.service";

import { TimeEntryComponent } from "../../components/time-entry/time-entry.component";
import { PORTAL_DATA } from "../../objects";

@Component({
  selector: "lunch-punch-dialog",
  templateUrl: "./lunch-punch.dialog.html",
  styleUrls: ["./lunch-punch.dialog.scss"]
})
export class LunchPunchDialog implements OnInit {
  selectedStartTime: string;
  selectedDuration: string;

  constructor(
    public ref: MatDialogRef<LunchPunchDialog>,
    private _overlay: Overlay,
    private _injector: Injector,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      submit: (startTime: string, duration: string) => Observable<any>;
    },
    private _toast: ToastService
  ) {}

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
    const overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "time-entry-overlay"]
    });

    const injector = this.createInjector(overlayRef, {
      title: "Enter start time for lunch punch.",
      duration: false,
      save: (hours: string, mins: string, ampm: string): Observable<any> => {
        if (hours) {
          this.selectedStartTime = hours + ":" + mins;
        } else {
          this.selectedStartTime = ":" + mins;
        }

        if (ampm) {
          this.selectedStartTime += " " + ampm;
        }

        return of(true);
      }
    });

    const portal = new ComponentPortal(TimeEntryComponent, null, injector);
    const containerRef = overlayRef.attach(portal);
    return overlayRef;
  };

  editDuration = () => {
    const overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "time-entry-overlay"]
    });

    const injector = this.createInjector(overlayRef, {
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
    const containerRef = overlayRef.attach(portal);
    return overlayRef;
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
