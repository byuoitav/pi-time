import { Injectable } from "@angular/core";
import {
  Router,
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from "@angular/router";
import { Observable, of, EMPTY, Subject } from "rxjs";
import { map, catchError, takeUntil, take } from "rxjs/operators";

import { APIService } from "./api.service";
import { Employee } from "../objects";

@Injectable({
  providedIn: "root"
})
export class EmployeeResolverService implements Resolve<Employee> {
  private unsubscribe = new Subject();

  constructor(private api: APIService, private router: Router) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<Employee> | Observable<never> {
    const id = route.paramMap.get("id");

    return this.api.getEmployee(id).pipe(
      take(2), // the first one is always undefined
      map(val => {
        if (val instanceof Employee) {
          return val;
        }
      }),
      catchError(err => {
        this.router.navigate(["/login"]);

        console.warn("error", err);
        return EMPTY;
      })
    );
  }
}
