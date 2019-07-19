import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material";
import { Observable, BehaviorSubject } from "rxjs";

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: APIService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this._empRef = data.empRef;
    });
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

              const obs = this.api.punch(data);

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
          }
        })
        .afterClosed()
        .subscribe(cancelled => {
          if (cancelled) {
            console.log(
              "reversing punch type:",
              state,
              "to",
              PunchType.reverse(state)
            );
            console.log(event);
            event.source.radioGroup.value = PunchType.reverse(state);
            // event.source.checked = false;
          }
        });
    } else {
      // clock in/out here
      data.time = new Date();
      const obs = this.api.punch(data);

      obs.subscribe(
        resp => {
          console.log("response data", resp);
        },
        err => {
          console.log("response ERROR", err);
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

    // if (job.isPhysicalFacilities && state === PunchType.In) {
    // show work order popup to clock in
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

          const obs = this.api.punch(data);

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
      }
    });
  };
}
