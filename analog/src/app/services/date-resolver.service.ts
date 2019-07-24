import { Injectable } from "@angular/core";
import {
  Router,
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from "@angular/router";
import { Observable, of, EMPTY, Subject, BehaviorSubject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { APIService, EmployeeRef } from "./api.service";
import { Employee } from "../objects";
import { ToastService } from "./toast.service";

@Injectable({
  providedIn: "root"
})
export class DateResolverService implements Resolve<any> {
  constructor(
    private api: APIService,
    private router: Router,
    private toast: ToastService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Observable<never> {
    const id = route.paramMap.get("id");
    const jobID = +route.paramMap.get("jobid");
    const date = route.paramMap.get("date");

    return this.api.getOtherHours(id, jobID, date);
  }
}
