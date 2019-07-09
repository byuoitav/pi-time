import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material";
import { BehaviorSubject } from "rxjs";

import { APIService } from "../../services/api.service";
import { Employee, Job, PunchType } from "../../objects";
import { WoTrcDialog } from "../../dialogs/wo-trc/wo-trc.dialog";

@Component({
  selector: "jobs",
  templateUrl: "./clock.component.html",
  styleUrls: ["./clock.component.scss"]
})
export class ClockComponent implements OnInit {
  public punchType = PunchType;

  private _emp: BehaviorSubject<Employee>;
  get emp(): Employee {
    if (this._emp) {
      return this._emp.value;
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
      this._emp = data.employee;
    });

    // TODO remove
    setTimeout(() => {
      this.clockInOut(this.emp.jobs[2], PunchType.In);
    }, 1500);
  }

  clockInOut = (job: Job, state: PunchType) => {
    console.log("clocking job", job.description, "to state", state);

    if (job.isPhysicalFacilities && state === PunchType.In) {
      // show work order popup to clock in
      const ref = this.dialog.open(WoTrcDialog, {
        width: "50vw",
        data: job
      });

      ref.afterClosed().subscribe(result => {
        console.log("closed with result", result);
      });
    } else {
      // clock in/out here
    }
  };

  toTimesheet = () => {
    console.log("going to job select");
    this.router.navigate(["./job/"], { relativeTo: this.route });
  };
}
