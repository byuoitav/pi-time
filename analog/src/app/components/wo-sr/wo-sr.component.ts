import { Component, OnInit, Input } from "@angular/core";
import {
  Day,
  Job,
  TRC,
  WorkOrderEntry,
  WorkOrder,
  Employee,
  LunchPunch,
  DeleteWorkOrder
} from "../../objects";
import { MatDialog } from "@angular/material";
import { WoTrcDialog } from "src/app/dialogs/wo-trc/wo-trc.dialog";
import { APIService } from "src/app/services/api.service";
import { Observable } from "rxjs";
import { LunchPunchDialog } from "src/app/dialogs/lunch-punch/lunch-punch.dialog";
import { ActivatedRoute } from "@angular/router";
import { share } from "rxjs/operators";
import { ToastService } from "src/app/services/toast.service";

@Component({
  selector: "wo-sr",
  templateUrl: "./wo-sr.component.html",
  styleUrls: [
    "./wo-sr.component.scss",
    "../day-overview/day-overview.component.scss"
  ]
})
export class WoSrComponent implements OnInit {
  @Input() day: Day;
  @Input() job: Job;
  @Input() emp: Employee;

  constructor(
    private api: APIService,
    private dialog: MatDialog,
    private _toast: ToastService
  ) {}

  ngOnInit() {}

  newWorkOrder() {
    const ref = this.dialog.open(WoTrcDialog, {
      width: "50vw",
      data: {
        title: "New Work Order",
        job: this.job,
        showTRC: this.showTRCs(),
        showWO: this.showWO(),
        showHours: true,
        submit: (
          trc?: TRC,
          wo?: WorkOrder,
          hours?: string
        ): Observable<any> => {
          const entry = new WorkOrderEntry();

          if (this.day.workOrderEntries) {
            entry.id = this.day.workOrderEntries.length + 1;
          } else {
            entry.id = 1;
          }

          entry.trc = trc;
          entry.workOrder = wo;
          entry.timeReportingCodeHours = hours;
          entry.editable = true;

          const obs = this.api
            .newWorkOrderEntry(this.emp.id, entry)
            .pipe(share());
          obs.subscribe(
            resp => {
              const msg = "Work Order Entry added sucessfully!";
              this._toast.show(msg, "DISMISS", 2000);
              console.log("response data", entry);
            },
            err => {
              console.warn("response ERROR", err);
            }
          );

          return obs;
        }
      }
    });
  }

  editWorkOrder(woToEdit: WorkOrderEntry) {
    const ref = this.dialog.open(WoTrcDialog, {
      width: "50vw",
      data: {
        title: "Edit Work Order",
        job: this.job,
        showTRC: false,
        showWO: false,
        showHours: true,
        chosenWO: woToEdit,
        delete: (): Observable<any> => {
          const req = new DeleteWorkOrder();
          req.jobID = Number(this.job.employeeJobID);
          req.date =
            this.day.time.getFullYear() +
            "-" +
            (this.day.time.getMonth() + 1) +
            "-" +
            this.day.time.getDate();

          req.sequenceNumber = woToEdit.id;

          const obs = this.api.deleteWorkOrder(this.emp.id, req).pipe(share());
          obs.subscribe(
            resp => {
              const msg = "Work Order Entry deleted sucessfully!";
              this._toast.show(msg, "DISMISS", 2000);
              console.log("response data", resp);
            },
            err => {
              console.warn("response ERROR", err);
            }
          );

          return obs;
        },
        submit: (
          trc?: TRC,
          wo?: WorkOrder,
          hours?: string
        ): Observable<any> => {
          const entry = new WorkOrderEntry();

          if (this.day.workOrderEntries) {
            entry.id = this.day.workOrderEntries.length + 1;
          } else {
            entry.id = 1;
          }

          entry.trc = trc;
          entry.workOrder = wo;
          entry.timeReportingCodeHours = hours;
          entry.editable = true;

          const obs = this.api
            .updateWorkOrderEntry(this.emp.id, entry)
            .pipe(share());
          obs.subscribe(
            resp => {
              const msg = "Work Order Entry updated sucessfully!";
              this._toast.show(msg, "DISMISS", 2000);
              console.log("response data", entry);
            },
            err => {
              console.warn("response ERROR", err);
            }
          );

          return obs;
        }
      }
    });
  }

  showTRCs(): boolean {
    if (this.job.trcs != undefined) {
      return this.job.trcs.length > 0;
    } else {
      return false;
    }
  }

  showWO(): boolean {
    if (this.job.workOrders != undefined) {
      return this.job.workOrders.length > 0;
    } else {
      return false;
    }
  }

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

          return this.api.lunchPunch(this.emp.id, body);
        }
      }
    });
  };
}
