import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { Observable, BehaviorSubject } from "rxjs";
import { share } from "rxjs/operators";

import { APIService, EmployeeRef } from "../../services/api.service";
import {
  Employee,
  PunchType,
  TRC,
  ClientPunchRequest,
  Position
} from "../../objects";
import { ToastService } from "src/app/services/toast.service";
import { ConfirmDialog } from "src/app/dialogs/confirm/confirm.dialog";

@Component({
  selector: "clock",
  templateUrl: "./clock.component.html",
  styleUrls: ["./clock.component.scss"]
})
export class ClockComponent implements OnInit {
  public punchType = PunchType;

  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }

    return undefined;
  }

  get offline(): Boolean {
    if (this._empRef) {
      return this._empRef.offline;
    }

    return undefined;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: APIService,
    public dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this._empRef = data.empRef;
    });
  }

  doubleClockConfirm(jobRef: BehaviorSubject<Position>, state: PunchType) {
    //TODO: fix this
    // if (jobRef.value.clockStatus === (state as string)) {
    if (false) {
      this.dialog
        .open(ConfirmDialog, {
          data: { state: PunchType.toNormalString(state) }
        })
        .afterClosed()
        .subscribe(confirmed => {
          if (confirmed === "confirmed") {
            this.clockInOut(jobRef, state, null);
          }
        });
    }
  }

  jobRef(jobID: number): BehaviorSubject<Position> {
    const position = this.emp.positions.find(j => j.positionNumber === jobID);
    const ref = new BehaviorSubject(position);

    this._empRef.subject().subscribe(emp => {
      const position = this.emp.positions.find(j => j.positionNumber === jobID);
      if (position) {
        ref.next(position);
      }
    });

    return ref;
  }

  clockInOut = (jobRef: BehaviorSubject<Position>, state: PunchType, event?) => {
    console.log("clocking job", jobRef.value.businessTitle, "to state", state);
    const data = new ClientPunchRequest();
    data.byuID = this.emp.id;
    data.jobID = jobRef.value.positionNumber;
    data.type = state;

    
    // clock in/out here
    data.time = new Date();

    const obs = this.api.punch(data).pipe(share());
    obs.subscribe(
      resp => {
        console.log("response data", resp);
        const msg =
          "Clocked " + PunchType.toNormalString(state) + " successfully!";
        this.toast.show(msg, "DISMISS", 2000);
      },
      err => {
        console.warn("response ERROR", err);
      }
    );
  };

  toTimesheet = () => {
    this.router.navigate(["./job/"], { relativeTo: this.route });
  };

  logout = () => {
    this._empRef.logout(false);
  };

}
