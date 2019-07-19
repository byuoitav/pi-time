import {
  Component,
  OnInit,
  Input,
  ViewEncapsulation,
  Inject,
  Injector
} from "@angular/core";
import { Router } from "@angular/router";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { Observable } from "rxjs";

import { APIService } from "../../services/api.service";
import { TimeEntryComponent } from "../time-entry/time-entry.component";
import {
  Day,
  PunchType,
  Punch,
  PORTAL_DATA,
  ClientPunchRequest
} from "../../objects";

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
    private router: Router,
    private _overlay: Overlay,
    private _injector: Injector
  ) {}

  ngOnInit() {}

  openKeyboard = (punch: Punch) => {
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
      ref: punch,
      save: this.submitUpdatedTime,
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

  submitUpdatedTime = (
    punch: any,
    hour: Number,
    min: Number
  ): Observable<any> => {
    if (punch instanceof Punch) {
      const req = new ClientPunchRequest();
      req.byuID = Number(this.byuID);
      req.jobID = this.jobID;
      req.type = punch.type;

      const date = new Date(punch.time);
      date.setHours(hour.valueOf());
      date.setMinutes(min.valueOf());
      date.setSeconds(0);

      req.time = date;
      const obs = this.api.punch(req);

      obs.subscribe(
        resp => {
          console.log("response data", resp);
        },
        err => {
          console.log("response ERROR", err);
        }
      );

      return obs;
    }
  };
}
