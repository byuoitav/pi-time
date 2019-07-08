import { Injectable } from "@angular/core";
import {
  Router,
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from "@angular/router";
import { Observable, of, EMPTY, Subject, BehaviorSubject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { APIService } from "./api.service";
import { Employee } from "../objects";

@Injectable({
  providedIn: "root"
})
export class EmployeeResolverService
  implements Resolve<BehaviorSubject<Employee>> {
  constructor(private api: APIService, private router: Router) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<BehaviorSubject<Employee>> | Observable<never> {
    const id = route.paramMap.get("id");
    const unsubscribe = new Subject();

    const employee = this.api.getEmployee(id);

    return new Observable(observer => {
      employee.pipe(takeUntil(unsubscribe)).subscribe(
        val => {
          if (val instanceof Employee) {
            observer.next(employee);
            observer.complete();
            unsubscribe.complete();
          }
        },
        err => {
          observer.error(err);
          unsubscribe.complete();
        }
      );

      return { unsubscribe() {} };
    });
  }
}
