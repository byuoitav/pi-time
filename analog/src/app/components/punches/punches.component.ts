import {
  Component,
  OnInit,
  Input,
  ViewEncapsulation,
  Inject,
  Injector
} from "@angular/core";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { Observable } from "rxjs";

import { TimeEntryComponent } from "../time-entry/time-entry.component";
import { Day, PunchType, Punch, PORTAL_DATA, LunchPunch } from "../../objects";
import { MatDialog } from '@angular/material';
import { LunchPunchDialog } from 'src/app/dialogs/lunch-punch/lunch-punch.dialog';
import { APIService } from 'src/app/services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: "punches",
  templateUrl: "./punches.component.html",
  styleUrls: ["./punches.component.scss"]
})
export class PunchesComponent implements OnInit {
  public punchType = PunchType;
  employeeID: string;
  @Input() day: Day;

  constructor(
    private _overlay: Overlay, 
    private _injector: Injector, 
    private dialog: MatDialog, 
    private api: APIService,
    private route: ActivatedRoute) {
      this.route.params.subscribe(params => {
        this.employeeID = params["id"];
      });
    }

  ngOnInit() {}

  openKeyboard = (punch: Punch) => {
    const overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "time-entry-overlay"]
    });

    const injector = this.createInjector(overlayRef, {
      title: "Enter time for " + PunchType.toString(punch.type) + " punch.",
      duration: false,
      save: (time: Date) => {
        overlayRef.dispose();
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
    const ref = this.dialog.open(
      LunchPunchDialog,
      {
        width: "50vw",
        data: {
         submit: (startTime: string, duration: string): Observable<any> => {
           const body = new LunchPunch();
           body.startTime = startTime;
           body.duration = duration;
           body.punchDate = new Date().toLocaleDateString();
           
           const obs = this.api.lunchPunch(this.employeeID, body);

           obs.subscribe(
             resp => {
               console.log("response data", resp);
             },
             err => {
               console.error("response ERROR", err);
             }
           );

           return obs;
         } 
        }
      }
    )
  }
}
