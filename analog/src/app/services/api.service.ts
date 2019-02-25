import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { BehaviorSubject } from "rxjs";

import { Employee, Job, TotalTime } from "../objects";

@Injectable({ providedIn: "root" })
export class APIService {
  public theme = "default";
  public rightHeader = "";

  private jsonConvert: JsonConvert;
  private urlParams: URLSearchParams;

  private employee: BehaviorSubject<Employee>;

  constructor(private http: HttpClient) {
    this.jsonConvert = new JsonConvert();
    this.jsonConvert.ignorePrimitiveChecks = false;

    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.has("theme")) {
      this.theme = this.urlParams.get("theme");
    }

    const emp = new Employee();
    emp.id = "111111111";
    emp.name = "Daniel Randall";

    const jobs = new Array<Job>();
    const totalTime = new TotalTime();

    totalTime.week = 10.35 * 60;
    totalTime.payPeriod = 17.89 * 60;

    emp.jobs = jobs;
    emp.totalTime = totalTime;

    this.employee = new BehaviorSubject<Employee>(emp);
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

  public getEmployee(id: string | number): BehaviorSubject<Employee> {
    this.rightHeader = this.employee.value.name;
    return this.employee;
  }
}
