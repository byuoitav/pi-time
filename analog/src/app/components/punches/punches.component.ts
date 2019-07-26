import { Component, OnInit, Input, Inject, Injector } from "@angular/core";
import { Router } from "@angular/router";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { MatDialog } from "@angular/material";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { Observable } from "rxjs";
import { share } from "rxjs/operators";

import { APIService } from "../../services/api.service";
import { TimeEntryComponent } from "../time-entry/time-entry.component";
import { LunchPunchDialog } from "src/app/dialogs/lunch-punch/lunch-punch.dialog";
import {
  Day,
  PunchType,
  Punch,
  PORTAL_DATA,
  ClientPunchRequest,
  LunchPunch,
  DeletePunch,
  Job
} from "../../objects";
import { ToastService } from "src/app/services/toast.service";
import { DeletePunchDialog } from "src/app/dialogs/delete-punch/delete-punch.dialog";

@Component({
  selector: "punches",
  templateUrl: "./punches.component.html",
  styleUrls: ["./punches.component.scss"]
})
export class PunchesComponent implements OnInit {
  public punchType = PunchType;

  @Input() byuID: string;
  @Input() jobID: number;
  @Input() day: Day;
  @Input() job: Job;

  constructor(
    private api: APIService,
    private dialog: MatDialog,
    private router: Router,
    private _overlay: Overlay,
    private _injector: Injector,
    private toast: ToastService
  ) {}

  ngOnInit() {}

  openKeyboard = (punch: Punch) => {
    if (punch.time !== undefined) {
      return;
    }

    const overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "time-entry-overlay"]
    });

    // set the time on the punch to the correct date
    punch.time = new Date(this.day.time);

    const injector = this.createInjector(overlayRef, {
      title: "Enter time for " + PunchType.toString(punch.type) + " punch.",
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

        const date = new Date(punch.time);
        date.setHours(h, m, 0, 0);

        const req = new ClientPunchRequest();
        req.sequenceNumber = punch.id;
        req.byuID = this.byuID;
        req.jobID = this.jobID;
        req.type = punch.type;
        req.time = date;

        const obs = this.api.fixPunch(req).pipe(share());
        obs.subscribe(
          resp => {
            console.log("response data", resp);
            const msg = "Successfully updated punch.";
            this.toast.show(msg, "DISMISS", 2000);
          },
          err => {
            console.warn("response ERROR", err);
          }
        );

        return obs;
      },
      error: () => {
        this.router.navigate([], {
          queryParams: {
            error: "Unable to update punch. Please try again."
          },
          queryParamsHandling: "merge"
        });
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

  lunchPunch = () => {
    console.log("lunch punch for job");
    const ref = this.dialog.open(LunchPunchDialog, {
      width: "50vw",
      data: {
        submit: (startTime: Date, duration: string): Observable<any> => {
          const req = new LunchPunch();
          req.duration = duration;
          req.jobID = this.jobID;

          req.startTime = new Date(this.day.time);
          req.startTime.setHours(
            startTime.getHours(),
            startTime.getMinutes(),
            0,
            0
          );

          const obs = this.api.lunchPunch(this.byuID, req).pipe(share());
          obs.subscribe(
            resp => {
              console.log("response data", resp);
              this.toast.show(
                "Successfully made lunch punch.",
                "DISMISS",
                2000
              );
            },
            err => {
              console.log("response ERROR", err);
            }
          );

          return obs;
        }
      }
    });
  };

  deletePunch = (punch: Punch) => {
    if (
      punch == null ||
      punch.deletablePair == null ||
      punch.deletablePair === 0
    ) {
      return;
    }

    this.dialog.open(DeletePunchDialog, {
      data: {
        punch: punch,
        submit: (): Observable<any> => {
          const req = new DeletePunch();
          req.punchTime = punch.time;
          req.sequenceNumber = punch.id;
          req.jobID = this.jobID;

          return this.api.deletePunch(this.byuID, req);
        }
      }
    });
  };
}
