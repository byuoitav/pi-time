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
export class EmployeeResolverService implements Resolve<EmployeeRef> {
  constructor(
    private api: APIService,
    private router: Router,
    private toast: ToastService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<EmployeeRef> | Observable<never> {
    const id = route.paramMap.get("id");
    const unsubscribe = new Subject();

    const empRef = this.api.getEmployee(id);

    return new Observable(observer => {
      empRef .subject()
        .pipe(takeUntil(unsubscribe))
        .subscribe(
          val => {            
            if (val instanceof Employee) {
              if (val.message !== undefined && val.message.length > 0) {
                this.toast.showIndefinitely(val.message as string, "DISMISS", true);
              }
              observer.next(empRef);
              observer.complete();
              unsubscribe.complete();
            }
          },
          err => {
            console.log("login error", err)
            this.router.navigate(["/login"], {
              queryParams: {
                error: err
              },
              queryParamsHandling: "merge"
            });

            observer.error(err);
            unsubscribe.complete();
          }
        );

      return { unsubscribe() {} };
    });
  }
}
