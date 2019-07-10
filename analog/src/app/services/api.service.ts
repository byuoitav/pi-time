import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { BehaviorSubject, Observable } from "rxjs";
import {
  Employee,
  Job,
  TotalTime,
  WorkOrder,
  Day,
  WorkOrderEntry,
  PunchType,
  TRC,
  JobType
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

  private employee: BehaviorSubject<Employee>;

  constructor(private http: HttpClient, private router: Router) {
    this.jsonConvert = new JsonConvert();
    this.jsonConvert.ignorePrimitiveChecks = false;

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
      console.error("error", event);
      employee.error("invalid employee id");
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
}

interface Message {
  key: string;
  value: object;
}
