import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Router, ActivationEnd, NavigationEnd} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {JsonConvert} from "json2typescript";
import {BehaviorSubject, Observable, throwError, Subscription} from "rxjs";

import {ErrorDialog} from "../dialogs/error/error.dialog";
import {ToastService} from "./toast.service";
import {
  Employee,
  Day,
  ClientPunchRequest,
  Punch,
  DateConverter
} from "../objects";
import {
  JsonObject,
  JsonProperty,
  Any,
  JsonCustomConvert,
  JsonConverter
} from "json2typescript";
import {stringify} from 'querystring';

export class EmployeeRef {
  private _employee: BehaviorSubject<Employee>;
  private _logout: Function;
  private _subsToDestroy: Subscription[] = [];

  public offline: boolean;
  public selectedDate: Date;

  get employee() {
    if (this._employee) {
      return this._employee.value;
    }

    return undefined;
  }

  constructor(employee: BehaviorSubject<Employee>, logout: (Boolean) => void, router: Router) {
    this._employee = employee;
    this._logout = logout;

    this._subsToDestroy.push(router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (!event.url.startsWith("/employee")) {
          // this is only for a session time out
          this.logout(true);
        }
      }
    }));
  }

  logout = (timeout: Boolean) => {
    for (const s of this._subsToDestroy) {
      s.unsubscribe();
    }

    if (this._logout) {
      if (timeout) {
        return this._logout(true);
      }
      return this._logout(false);
    }
  };

  subject = (): BehaviorSubject<Employee> => {
    return this._employee;
  };
}

@Injectable({providedIn: "root"})
export class APIService {
  public theme = "default";

  private jsonConvert: JsonConvert;
  private _hiddenDarkModeCount = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog,
    private toast: ToastService
  ) {
    this.jsonConvert = new JsonConvert();
    this.jsonConvert.ignorePrimitiveChecks = false;

    // watch for route changes to show popups, etc
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = new URL(window.location.protocol + window.location.host + event.url);

        if (url.searchParams.has("error")) {
          const err = url.searchParams.get("error");

          if (err.length > 0) {
            this.error(err);
          } else {
            // remove the error param
            this.router.navigate([], {
              queryParams: {error: null},
              queryParamsHandling: "merge",
              preserveFragment: true
            });
          }
        }

        if (url.searchParams.has("theme")) {
          document.body.classList.remove(this.theme + "-theme");
          this.theme = url.searchParams.get("theme");
          document.body.classList.add(this.theme + "-theme");
        } else {
          document.body.classList.remove(this.theme + "-theme");
          this.theme = "";
        }
      }
    });
  }

  public switchTheme(name: string) {
    console.log("switching theme to", name);

    this.router.navigate([], {
      queryParams: {theme: name},
      queryParamsHandling: "merge"
    });
  }

  hiddenDarkMode = () => {
    if (this.theme === "dark") {
      return;
    }

    this._hiddenDarkModeCount++;
    setTimeout(() => {
      this._hiddenDarkModeCount--;
    }, 3000);

    if (this._hiddenDarkModeCount > 4) {
      this.switchTheme("dark");
    }
  };

  getEmployee = (id: string | number): EmployeeRef => {
    const employee = new BehaviorSubject<Employee>(undefined);

    let protocol = "ws:";
    if (window.location.protocol === "https:") {
      protocol = "wss:";
    }

    const endpoint = protocol + "//" + window.location.host + "/id/" + id;
    const ws = new WebSocket(endpoint);

    //send login event
    if (id) {
      const event = new Event();
      event.User = String(id);
      event.EventTags = ["pitime-ui"];
      event.Key = "login";
      event.Value = String(id);
      event.Timestamp = new Date();
      this.sendEvent(event);
    }

    const empRef = new EmployeeRef(employee, (timeout: Boolean) => {
      if (timeout) {
        console.log("session timed out for", employee.value.id)
      } else {
        console.log("logging out employee", employee.value.id);
      }

      // clean up the websocket
      ws.close();

      //get current employee
      const currEmp = employee.value

      // no more employee values
      employee.complete();

      // send logout event
      if (timeout) {
        if (currEmp) {
          const event = new Event();
  
          event.User = currEmp.id;
          event.EventTags = ["pitime-ui"];
          event.Key = "timeout";
          event.Value = currEmp.id;
          event.Timestamp = new Date();
  
          this.sendEvent(event);
        }
      } else {
        if (currEmp) {
          const event = new Event();
  
          event.User = currEmp.id;
          event.EventTags = ["pitime-ui"];
          event.Key = "logout";
          event.Value = currEmp.id;
          event.Timestamp = new Date();
          this.sendEvent(event);
        }  
      }

      // reset theme
      this.switchTheme("");

      // route to login page
      this.router.navigate(["/login"], {replaceUrl: true});
    }, this.router);

    ws.onmessage = event => {
      const data: JSON = JSON.parse(event.data);      
     
      try {
        const emp = this.jsonConvert.deserializeObject(data, Employee);
        emp.id = String(id);
        this.loadInStatus(emp);
        this.loadDays(emp);
        

        console.log("updated employee", emp);
        employee.next(emp);
      } catch (e) {
        console.warn("unable to deserialize employee", e);
        employee.error("invalid response from api");
      }
    };

    ws.onerror = event => {
      console.error("websocket error", event);
      employee.error("Error with employee - " + event.returnValue);
    };

    ws.onclose = event => {
      console.error("websocket close", event);
      employee.error(event.reason);
    };

    return empRef;
  };

  error = (msg: string) => {
    const errorDialogs = this.dialog.openDialogs.filter(dialog => {
      return dialog.componentInstance instanceof ErrorDialog;
    });

    if (errorDialogs.length > 0) {
      // change the message in this one?
    } else {
      const ref = this.dialog.open(ErrorDialog, {
        width: "80vw",
        data: {
          msg: msg
        }
      });

      ref.afterClosed().subscribe(result => {
        this.router.navigate([], {
          queryParams: {error: null},
          queryParamsHandling: "merge",
          preserveFragment: true
        });
      });
    }
  };

  punch = (data: ClientPunchRequest): Observable<any> => {
    try {
      const json = this.jsonConvert.serialize(data);
      //Send logout event
      if (data) {
        const event = new Event();

        event.User = data.byuID;
        event.EventTags = ["pitime-ui"];
        if (data.type === "I") {
          event.Key = "time-punch-in";
        } else if (data.type === "O") {
          event.Key = "time-punch-out";
        }

        event.Value = data.byuID;
        event.Timestamp = new Date();

        this.sendEvent(event);
      }

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

  getOtherHours = (byuID: string, jobID: number, date: string) => {
    try {
      return this.http.get("/otherhours/" + byuID + "/" + jobID + "/" + date, {
        responseType: "text",
        headers: new HttpHeaders({
          "content-type": "application/json"
        })
      });
    } catch (e) {
      return throwError(e);
    }
  };

  sendEvent = (event: Event) => {
    const data = this.jsonConvert.serializeObject(event);
    console.log("sending event", data);
    
    this.http.post("/event", data).subscribe();
  }

  //determines In/Out status for each position based off most recent punch
  loadInStatus(emp: Employee): any {
    const today = new Date();
    for (const pos of emp.positions) {
      let currPunch: Punch;
      for (const punch of emp.periodPunches) {
       if (Number(pos.positionNumber) === Number(punch.positionNumber)) {
          if (currPunch === undefined) {
            currPunch = punch;
          }
          else if (punch.time > currPunch.time) {
            currPunch = punch;
          }
       }
      }
      if (currPunch !== undefined) {
        if (currPunch.type === "IN") {
          pos.inStatus = true;
        }
        else {
          pos.inStatus = false;
        }
      }
      else {
        pos.inStatus = false;
      }
    }
  } 

  loadDays(emp: Employee) {
    const today = Date.now();
    
    //for each position
    for (const pos of emp.positions) {

      //create an array of days for the last 62 days
      const days: Day[] = [];
      const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
      for (let i = 0; i < 62; i++) {
        const day = new Day();
        day.time = new Date(today - (i * oneDayInMilliseconds));
        days.push(day);
      }

      //add punches to the days
      for (const punch of emp.periodPunches) {
        if (Number(pos.positionNumber) === Number(punch.positionNumber)) {
          for (const day of days) {
            if (punch.time.getDate() === day.time.getDate() 
            && punch.time.getMonth() === day.time.getMonth() 
          && punch.time.getFullYear() === day.time.getFullYear()) {
              day.punches.push(punch);
            }
          }
        }
      }
      pos.days = days;
    }
  }

}

@JsonObject("Event")
export class Event {
  @JsonProperty("generating-system", String, true)
  GeneratingSystem: String = undefined;

  @JsonProperty("timestamp", DateConverter, true)
  Timestamp: Date = undefined;

  @JsonProperty("event-tags", [String], true)
  EventTags: String[] = new Array<String>();

  @JsonProperty("key", String, true)
  Key: String = undefined;

  @JsonProperty("value", String, true)
  Value: String = undefined;

  @JsonProperty("user", String, true)
  User: String = undefined;

  @JsonProperty("data", Any, true)
  Data: any = undefined;

  public hasTag(tag: String): boolean {
    return this.EventTags.includes(tag);
  }
}

interface Message {
  value: object;
}


