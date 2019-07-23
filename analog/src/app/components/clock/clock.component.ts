import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material";
import { Observable, BehaviorSubject } from "rxjs";
import { share } from "rxjs/operators";

import { APIService, EmployeeRef } from "../../services/api.service";
import {
  Employee,
  Job,
  PunchType,
  TRC,
  WorkOrder,
  ClientPunchRequest
} from "../../objects";
import { WoTrcDialog } from "../../dialogs/wo-trc/wo-trc.dialog";
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
    private api: APIService,
    public dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this._empRef = data.empRef;
    });
  }

  doubleClockConfirm(job: Job, state: PunchType) {
    if (job.clockStatus === (state as string)) {
      console.log("confirming...");
      this.dialog
        .open(ConfirmDialog, {
          data: { state: PunchType.toNormalString(state) }
        })
        .afterClosed()
        .subscribe(confirmed => {
          if (confirmed === "confirmed") {
            this.clockInOut(job, state, null);
          }
        });
    }
  }

  clockInOut = (job: Job, state: PunchType, event?) => {
    console.log("clocking job", job.description, "to state", state);
    const data = new ClientPunchRequest();
    data.byuID = Number(this.emp.id);
    data.jobID = job.employeeJobID;
    data.type = state;

    if (job.isPhysicalFacilities && state === PunchType.In) {
      // show work order popup to clock in
      const ref = this.dialog
        .open(WoTrcDialog, {
          width: "50vw",
          data: {
            title: "Select Work Order",
            job: job,
            showTRC: job.trcs.length > 0,
            showWO: job.workOrders.length > 0,
            showHours: false,
            submit: (trc?: TRC, wo?: WorkOrder): Observable<any> => {
              data.time = new Date();
              if (trc) {
                data.trcID = trc.id;
              }
              if (wo) {
                data.workOrderID = wo.id;
              }

              const obs = this.api.punch(data).pipe(share());
              obs.subscribe(
                resp => {
                  const msg =
                    "Clocked " +
                    PunchType.toNormalString(state) +
                    " successfully!";
                  this.toast.show(msg, "DISMISS", 2000);
                  console.log("response data", data);
                },
                err => {
                  console.warn("response ERROR", err);
                }
              );

              return obs;
            }
          }
        })
        .afterClosed()
        .subscribe(cancelled => {
          if (cancelled) {
            if (event != null) {
              console.log(
                "reversing punch type:",
                state,
                "to",
                PunchType.reverse(state)
              );
              console.log(event);
              event.source.radioGroup.value = PunchType.reverse(state);
            }
          }
        });
    } else {
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
    }
  };

  toTimesheet = () => {
    console.log("going to job select");
    this.router.navigate(["./job/"], { relativeTo: this.route });
  };

  logout = () => {
    this._empRef.logout();
  };

  canChangeWorkOrder(job: Job) {
    if (job === undefined) {
      return false;
    }

    return job.clockStatus === PunchType.In && job.isPhysicalFacilities;
  }

  hasTimesheetException = () => {
    if (this.offline) {
      return "";
    }

    if (
      this.emp.jobs.some(j =>
        j.days.some(d => d.hasPunchException || d.hasWorkOrderException)
      )
    ) {
      // return "⚠";
      return "!";
    }

    return "";
  };

  changeWorkOrder = (job: Job) => {
    console.log("changing work order for job ", job);
    const data = new ClientPunchRequest();
    data.byuID = Number(this.emp.id);
    data.jobID = job.employeeJobID;
    data.type = PunchType.Transfer;

    const ref = this.dialog.open(WoTrcDialog, {
      width: "50vw",
      data: {
        title: "Change Work Order",
        job: job,
        showTRC: job.trcs.length > 0,
        showWO: job.workOrders.length > 0,
        showHours: false,
        submit: (trc?: TRC, wo?: WorkOrder): Observable<any> => {
          data.time = new Date();
          if (trc) {
            data.trcID = trc.id;
          }
          if (wo) {
            data.workOrderID = wo.id;
          }

          const obs = this.api.punch(data).pipe(share());
          obs.subscribe(
            resp => {
              console.log("response data", resp);
              const msg = "Transferred punch successfully!";
              this.toast.show(msg, "DISMISS", 2000);
            },
            err => {
              console.warn("response ERROR", err);
            }
          );

          return obs;
        }
      }
    });
  };
}
