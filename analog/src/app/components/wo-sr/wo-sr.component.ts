import { Component, OnInit, Input } from "@angular/core";
import { Day, Job, TRC, WorkOrderEntry, WorkOrder, Employee, LunchPunch } from "../../objects";
import { MatDialog } from '@angular/material';
import { WoTrcDialog } from 'src/app/dialogs/wo-trc/wo-trc.dialog';
import { APIService } from 'src/app/services/api.service';
import { Observable } from 'rxjs';
import { LunchPunchDialog } from 'src/app/dialogs/lunch-punch/lunch-punch.dialog';
import { ActivatedRoute } from '@angular/router';

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

  constructor(private api: APIService, private dialog: MatDialog) {

  }

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
        submit: (trc?: TRC, wo?: WorkOrder, hours?: string): Observable<any> => {
          const entry = new WorkOrderEntry();

          if (this.day.workOrderEntries) {
            entry.id = this.day.workOrderEntries.length + 1;
          } else {
            entry.id = 1;
          }

          entry.trc = trc;
          entry.workOrder = wo;
          entry.hoursBilled = hours;
          entry.editable = true;

          return this.api.newWorkOrderEntry(this.emp.id, entry);
        }
      }
    });
  }

  editWorkOrder(woToEdit: WorkOrder) {
    const ref = this.dialog.open(WoTrcDialog, {
      width: "50vw",
      data: {
        title: "Edit Work Order",
        job: this.job,
        showTRC: this.showTRCs(),
        showWO: this.showWO(),
        showHours: true,
        chosenWO: woToEdit,
        submit: (trc?: TRC, wo?: WorkOrder, hours?: string): Observable<any> => {
          const entry = new WorkOrderEntry();

          if (this.day.workOrderEntries) {
            entry.id = this.day.workOrderEntries.length + 1;
          } else {
            entry.id = 1;
          }

          entry.trc = trc;
          entry.workOrder = wo;
          entry.hoursBilled = hours;
          entry.editable = true;

          return this.api.updateWorkOrderEntry(this.emp.id, entry);
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
           
           return this.api.lunchPunch(this.emp.id, body);
         } 
        }
      }
    )
  }
}
