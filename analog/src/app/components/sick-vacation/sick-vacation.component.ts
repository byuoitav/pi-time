import { Component, OnInit, Input, Inject, Injector } from "@angular/core";
import { Router } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { Observable } from "rxjs";
import { share } from "rxjs/operators";

import { APIService } from "../../services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { TimeEntryComponent } from "../time-entry/time-entry.component";
import { Day, OtherHour, OtherHourRequest, PORTAL_DATA } from "../../objects";

@Component({
  selector: "sick-vacation",
  templateUrl: "./sick-vacation.component.html",
  styleUrls: ["./sick-vacation.component.scss"]
})
export class SickVacationComponent implements OnInit {
  @Input() byuID: string;
  @Input() jobID: number;
  @Input() day: Day;

  constructor(
    private api: APIService,
    private _overlay: Overlay,
    private _injector: Injector,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {}

  openTimeEdit = (other: OtherHour) => {
    if (!other.editable) {
      return;
    }

    const overlayRef = this._overlay.create({
      height: "100vh",
      width: "100vw",
      disposeOnNavigation: true,
      hasBackdrop: false,
      panelClass: ["overlay", "time-entry-overlay"]
    });

    const injector = this.createInjector(overlayRef, {
      title: "Enter time for " + other.trc.description + " hours.",
      duration: true,
      save: (hours: string, mins: string): Observable<any> => {
        const req = new OtherHourRequest();
        req.jobID = this.jobID;
        req.sequenceNumber = other.sequenceNumber;
        req.timeReportingCodeHours = hours + ":" + mins;
        req.trcID = other.trc.id;
        req.punchDate = this.day.time;

        const obs = this.api.submitOtherHour(this.byuID, req).pipe(share());
        obs.subscribe(
          resp => {
            console.log("response data", resp);
            const msg = other.trc.description + "Hours Recorded";
            this.toast.show(msg, "DISMISS", 2000);
          },
          err => {
            console.warn("response ERROR", err);
          }
        );

        return obs;
      },
      error: err => {
        let msg =
          "Unable to update " +
          other.trc.description +
          " hours. Please try again.";
        if (err instanceof HttpErrorResponse) {
          msg = err.error;
        }

        this.router.navigate([], {
          queryParams: {
            error: msg
          },
          queryParamsHandling: "merge",
          preserveFragment: true
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
}
