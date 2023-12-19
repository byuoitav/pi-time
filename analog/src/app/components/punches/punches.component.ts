import {Component, OnInit, Input, Inject, Injector, OnDestroy} from "@angular/core";
import {Router, NavigationStart} from "@angular/router";
import {ComponentPortal, PortalInjector} from "@angular/cdk/portal";
import {MatDialog} from "@angular/material/dialog";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {Observable, Subscription} from "rxjs";
import {share} from "rxjs/operators";

import {APIService} from "../../services/api.service";
import {
  Day,
  PunchType,
  Punch,
  PORTAL_DATA,
  ClientPunchRequest,
  Position
} from "../../objects";
import {ToastService} from "src/app/services/toast.service";


@Component({
  selector: "punches",
  templateUrl: "./punches.component.html",
  styleUrls: ["./punches.component.scss"]
})
export class PunchesComponent implements OnInit, OnDestroy {
  public punchType = PunchType;

  @Input() byuID: string;
  @Input() jobID: number;
  @Input() day: Day;
  @Input() job: Position;

  private _overlayRef: OverlayRef;
  private _subsToDestroy: Subscription[] = [];

  constructor(
    private api: APIService,
    private dialog: MatDialog,
    private router: Router,
    private _overlay: Overlay,
    private _injector: Injector,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this._subsToDestroy.push(this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this._overlayRef) {
          this._overlayRef.detach();
          this._overlayRef.dispose();

          this._overlayRef = undefined;
        }
      }
    }));
  }

  ngOnDestroy() {
    for (const s of this._subsToDestroy) {
      s.unsubscribe();
    }
  }


  private createInjector = (
    overlayRef: OverlayRef,
    data: any
  ): PortalInjector => {
    const tokens = new WeakMap();

    tokens.set(OverlayRef, overlayRef);
    tokens.set(PORTAL_DATA, data);

    return new PortalInjector(this._injector, tokens);
  };

  public calculateTotalHours(day: Day): Day {
    if (day.punches.length === 0) {
      day.punchedHours = "0.0";
      day.reportedHours = "0.0";
      return day;
    }
  
    if (day.punchedHours !== undefined) {
      return day;
    }
   
    let copyPunches = new Array<Punch>;
    day.punches.slice().sort(this.comparePunches);
    for (let i = 0; i < day.punches.length; i++) {
      copyPunches.push(day.punches[i]);
    }
    let totalHours: number = 0.0;

    if (copyPunches[0].type === "OUT") {
      let tempPunch = new Punch();
      tempPunch.type = "IN";
      tempPunch.time = new Date();
      //set the hours minutes and seconds to be 00:00:00
      tempPunch.time.setTime(day.punches[0].time.getTime());
      tempPunch.time.setHours(0);
      tempPunch.time.setMinutes(0);
      tempPunch.time.setSeconds(0);
      copyPunches.push(tempPunch);
    } 
    
   
    if (copyPunches[copyPunches.length - 1].type === "IN") {
      let tempPunch = new Punch();
      tempPunch.type = "OUT";
      tempPunch.time = new Date();
      //set the hours minutes and seconds to be 23:59:59
      tempPunch.time.setTime(day.punches[0].time.getTime());
      tempPunch.time.setHours(23);
      tempPunch.time.setMinutes(59);
      tempPunch.time.setSeconds(59);
      copyPunches.push(tempPunch);
    }
    copyPunches = copyPunches.slice().sort(this.comparePunches);

    console.log(copyPunches);
    console.log(day.punches);
    for (let i = copyPunches.length - 1; i > 0; i -= 2) {
      console.log(copyPunches[i].time.getTime());
      console.log(copyPunches[i - 1].time.getTime());
      let timeDiff = copyPunches[i].time.getTime() - copyPunches[i - 1].time.getTime();
      console.log(timeDiff);
      let hours = timeDiff / (1000 * 3600);
      console.log(hours);
      totalHours += hours;
    }
  
    day.punchedHours = parseFloat(totalHours.toFixed(2)).toString(); 
    day.reportedHours = parseFloat(totalHours.toFixed(2)).toString();
    return day;
  }
  
  public comparePunches(a: Punch, b: Punch): number {
    return a.time.getTime() - b.time.getTime();
  }

}
