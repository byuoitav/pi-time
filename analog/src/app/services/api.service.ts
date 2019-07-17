import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router, ActivationEnd } from "@angular/router";
import { MatDialog } from "@angular/material";
import { JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { BehaviorSubject, Observable, throwError } from "rxjs";

import { ErrorDialog } from "../dialogs/error/error.dialog";
import {
  Employee,
  Job,
  TotalTime,
  WorkOrder,
  Day,
  WorkOrderEntry,
  PunchType,
  TRC,
  JobType,
  ClientPunchRequest
} from "../objects";

export class EmployeeRef {
  private _employee: BehaviorSubject<Employee>;
  private _logout;

  get employee() {
    if (this._employee) {
      return this._employee.value;
    }

    return undefined;
  }

  constructor(employee: BehaviorSubject<Employee>, logout: () => void) {
    this._employee = employee;
    this._logout = logout;
  }

  logout = () => {
    if (this._logout) {
      return this._logout();
    }

    return undefined;
  };

  observable = (): Observable<Employee> => {
    if (this._employee) {
      return this._employee.asObservable();
    }

    return undefined;
  };
}

@Injectable({ providedIn: "root" })
export class APIService {
  public theme = "default";

  private jsonConvert: JsonConvert;
  private urlParams: URLSearchParams;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.jsonConvert = new JsonConvert();
    this.jsonConvert.ignorePrimitiveChecks = false;

    // watch for route changes to show popups, etc
    this.router.events.subscribe(event => {
      if (event instanceof ActivationEnd) {
        const snapshot = event.snapshot;

        if (snapshot && snapshot.queryParams && snapshot.queryParams.error) {
          this.error(snapshot.queryParams.error);
        }
      }
    });

    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.has("theme")) {
      this.theme = this.urlParams.get("theme");
    }
  }

  public switchTheme(name: string) {
    console.log("switching theme to", name);

    this.theme = name;
    this.urlParams.set("theme", name);
    window.history.replaceState(
      null,
      "BYU Time Clock",
      window.location.pathname + "?" + this.urlParams.toString()
    );
  }

  getEmployee = (id: string | number): EmployeeRef => {
    const employee = new BehaviorSubject<Employee>(undefined);

    const endpoint = "ws://" + window.location.host + "/id/" + id;
    const ws = new WebSocket(endpoint);

    ws.onmessage = event => {
      const data: Message = JSON.parse(event.data);

      console.debug("key: '" + data.key + "', value:", data.value);
      switch (data.key) {
        case "employee":
          try {
            const emp = this.jsonConvert.deserializeObject(
              data.value,
              Employee
            );

            // TODO remove section
            const wo1 = new WorkOrder();
            wo1.id = "QR3924";
            wo1.name = "PPCH Pipe Maintenance";

            const wo2 = new WorkOrder();
            wo2.id = "QZ3950";
            wo2.name = "IPF Turf Maintenance";

            const wo3 = new WorkOrder();
            wo3.id = "FJ3918";
            wo3.name =
              "Stand and Do Nothing and Look Really Bored and Yeah. Fun Stuff.";

            const wo4 = new WorkOrder();
            wo4.id = "LK1958";
            wo4.name = "Rake Leaves";

            for (const job of emp.jobs) {
              if (!job.isPhysicalFacilities) {
                continue;
              }

              job.workOrders.push(wo1);
              job.workOrders.push(wo2);
              job.workOrders.push(wo3);
              job.workOrders.push(wo4);
            }
            // TODO end remove section

            console.log("updated employee", emp);
            employee.next(emp);
          } catch (e) {
            console.warn("unable to deserialize employee", e);
            employee.error("invalid response from api");
          }
          break;
      }
    };

    ws.onerror = event => {
      console.error("websocket error", event);
      employee.error("No employee found with the given ID.");
    };

    const empRef = new EmployeeRef(employee, () => {
      console.log("logging out employee", employee.value.id);

      // clean up the websocket
      ws.close();

      // no more employee values
      employee.complete();

      // route to login page
      this.router.navigate(["/login"], { replaceUrl: true });
    });

    return empRef;
  };

  clockInOut = (data: ClientPunchRequest): Observable<any> => {
    try {
      const json = this.jsonConvert.serialize(data);

      return this.http.post("/punch/" + data.byuID, json, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  };

  error = (msg: string) => {
    const errorDialogs = this.dialog.openDialogs.filter(dialog => {
      return dialog.componentInstance instanceof ErrorDialog;
    });

    if (errorDialogs.length > 0) {
      // change the message in this one?
    } else {
      const ref = this.dialog.open(ErrorDialog, {
        width: "70vw",
        data: {
          msg: msg
        }
      });

      ref.afterClosed().subscribe(result => {
        this.router.navigate([], {
          queryParams: { error: null },
          queryParamsHandling: "merge"
        });
      });
    }
  };

  sendWorkOrderEntry = (byuID: string, data: WorkOrderEntry) => {
    try {
      const json = this.jsonConvert.serialize(data);
      return this.http.post("/workorderentry/" + byuID, data, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  }
}

interface Message {
  key: string;
  value: object;
}
