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
import { Day, PunchType, Punch, PORTAL_DATA } from "../../objects";

@Component({
  selector: "punches",
  templateUrl: "./punches.component.html",
  styleUrls: ["./punches.component.scss"]
})
export class PunchesComponent implements OnInit {
  public punchType = PunchType;

  @Input() day: Day;

  constructor(private _overlay: Overlay, private _injector: Injector) {}

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
}
