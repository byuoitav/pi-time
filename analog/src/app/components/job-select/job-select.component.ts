import {Component, OnInit, OnDestroy} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {BehaviorSubject, Subscription} from "rxjs";

import {EmployeeRef, APIService} from "../../services/api.service";
import {Employee} from "../../objects";

@Component({
  selector: "job-select",
  templateUrl: "./job-select.component.html",
  styleUrls: ["./job-select.component.scss"]
})
export class JobSelectComponent implements OnInit, OnDestroy {
  private _empRef: EmployeeRef;
  get emp(): Employee {
    if (this._empRef) {
      return this._empRef.employee;
    }
    return undefined;
  }

  private _subsToDestroy: Subscription[] = [];

  constructor(private route: ActivatedRoute, private router: Router, public api: APIService) {}

  ngOnInit() {
    this._subsToDestroy.push(this.route.data.subscribe(data => {
      this._empRef = data.empRef;

      this._subsToDestroy.push(this._empRef.subject().subscribe(emp => {
        if (emp && emp.positions.length === 1) {
          this.selectJob(+emp.positions[0].positionNumber);
        }
      }));
    }));
  }

  ngOnDestroy() {
    for (const s of this._subsToDestroy) {
      s.unsubscribe();
    }
    this._empRef = undefined;
  }

  selectJob = (jobID: number) => {
    this.router.navigate(["./" + jobID + "/date/"], {relativeTo: this.route});
  };

  logout = () => {
    this._empRef.logout(false);
  };

  goBack() {
    this.router.navigate(["/employee/" + this.emp.id], {
      queryParamsHandling: "preserve"
    });
  }

}
