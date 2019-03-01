import { Injectable } from "@angular/core";
import {
  Router,
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from "@angular/router";
import { Observable, of, EMPTY } from "rxjs";
import { mergeMap, take } from "rxjs/operators";

import { APIService } from "./api.service";
import { Employee } from "../objects";

@Injectable({
  providedIn: "root"
})
export class EmployeeResolverService implements Resolve<Employee> {
  constructor(private api: APIService, private router: Router) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<Employee> | Observable<never> {
    const id = route.paramMap.get("id");

    return this.api.getEmployee(id).pipe(
      take(1),
      mergeMap(emp => {
        if (emp) {
          return of(emp);
        } else {
          // id not found
          this.router.navigate(["/login"]);
          return EMPTY;
        }
      })
    );
  }
}
