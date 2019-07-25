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

  doubleClockConfirm(jobRef: BehaviorSubject<Job>, state: PunchType) {
    if (jobRef.value.clockStatus === (state as string)) {
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

  jobRef(jobID: number): BehaviorSubject<Job> {
    const job = this.emp.jobs.find(j => j.employeeJobID === jobID);
    const ref = new BehaviorSubject(job);

    this._empRef.subject().subscribe(emp => {
      const job = this.emp.jobs.find(j => j.employeeJobID === jobID);
      if (job) {
        ref.next(job);
      }
    });

    return ref;
  }

  clockInOut = (jobRef: BehaviorSubject<Job>, state: PunchType, event?) => {
    console.log("clocking job", jobRef.value.description, "to state", state);
    const data = new ClientPunchRequest();
    data.byuID = this.emp.id;
    data.jobID = jobRef.value.employeeJobID;
    data.type = state;

    const showWO = new BehaviorSubject<Boolean>(
      jobRef.value.workOrders.length > 0
    );
    const showTRC = new BehaviorSubject<Boolean>(jobRef.value.trcs.length > 0);

    jobRef.subscribe(job => {
      showWO.next(job.workOrders.length > 0);
      showTRC.next(job.trcs.length > 0);
    });

    if (jobRef.value.isPhysicalFacilities && state === PunchType.In) {
      // show work order popup to clock in
      const ref = this.dialog
        .open(WoTrcDialog, {
          width: "50vw",
          data: {
            title: "Select Work Order",
            jobRef: jobRef,
            showTRC: showTRC,
            showWO: showWO,
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

  changeWorkOrder = (jobRef: BehaviorSubject<Job>) => {
    console.log("changing work order for job ", jobRef.value);
    const data = new ClientPunchRequest();
    data.byuID = this.emp.id;
    data.jobID = jobRef.value.employeeJobID;
    data.type = PunchType.Transfer;

    const showWO = new BehaviorSubject<Boolean>(
      jobRef.value.workOrders.length > 0
    );
    const showTRC = new BehaviorSubject<Boolean>(jobRef.value.trcs.length > 0);

    jobRef.subscribe(job => {
      showWO.next(job.workOrders.length > 0);
      showTRC.next(job.trcs.length > 0);
    });

    const ref = this.dialog.open(WoTrcDialog, {
      width: "50vw",
      data: {
        title: "Change Work Order",
        jobRef: jobRef,
        showTRC: showTRC,
        showWO: showWO,
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

  findDescription(job: Job): string {
    if (job == null || job.currentWorkOrder == null) {
      return "";
    }

    const wo = job.workOrders.find(
      wo => wo.id === job.currentWorkOrder.id
    );

    if (wo == null) {
      return "";
    }
    
    return wo.toString()
  }
}
