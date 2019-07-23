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
  DeletePunch
} from "../../objects";
import { ToastService } from "src/app/services/toast.service";
import { DeletePunchDialog } from 'src/app/dialogs/delete-punch/delete-punch.dialog';

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
      save: (hours: string, mins: string): Observable<any> => {
        const req = new ClientPunchRequest();
        req.byuID = Number(this.byuID);
        req.jobID = this.jobID;
        req.type = punch.type;

        const date = new Date(punch.time);
        date.setHours(Number(hours), Number(mins), 0, 0);

        req.time = date;

        const obs = this.api.punch(req).pipe(share());
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

  punchTime = (punch: Punch): string => {
    if (punch.time) {
      let hours = punch.time.getHours();
      let minutes = punch.time.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";

      hours = hours % 12;
      const minutesStr = minutes < 10 ? "0" + minutes : minutes;

      return hours + ":" + minutesStr + " " + ampm;
    }

    if (punch.editedTime) {
      const time =
        punch.editedTime.length >= 3
          ? punch.editedTime.slice(0, 1) +
            ":" +
            punch.editedTime.slice(1, punch.editedTime.length)
          : punch.editedTime;

      if (punch.editedAMPM) {
        return time + " " + punch.editedAMPM;
      }

      return time;
    }

    if (punch.editedAMPM) {
      return "--:-- " + punch.editedAMPM;
    }

    return "--:--";
  };

  lunchPunch = () => {
    console.log("lunch punch for job");
    const ref = this.dialog.open(LunchPunchDialog, {
      width: "50vw",
      data: {
        submit: (startTime: string, duration: string): Observable<any> => {
          const body = new LunchPunch();
          body.startTime = startTime;
          body.duration = duration;
          body.punchDate = new Date().toLocaleDateString();

          return this.api.lunchPunch(this.byuID, body);
        }
      }
    });
  };

  deletePunch = (punch: Punch) => {
    if (punch == null || punch.deletablePair == null || punch.deletablePair === 0) {
      return;
    }

    this.dialog.open(DeletePunchDialog, { 
      data: { 
        punch: punch,
        submit: (yes: boolean): Observable<any> => {
          if (yes) {
            const dPunch = new DeletePunch();
            dPunch.punchTime = punch.time.toLocaleTimeString();
            dPunch.punchType = PunchType.fromString(punch.type);
            dPunch.sequenceNumber = punch.id;

            return this.api.deletePunch(this.jobID, dPunch);
          }
        }
      }
    });
  }
}
