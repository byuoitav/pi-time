import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { JsonConvert, OperationMode, ValueCheckingMode } from "json2typescript";
import { BehaviorSubject } from "rxjs";

import {
  Employee,
  Job,
  TotalTime,
  WorkOrder,
  Day,
  WorkOrderBilling
} from "../objects";

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
    emp.showWorkOrders = true;

    const jobs = new Array<Job>();
    const totalTime = new TotalTime();

    totalTime.week = 3.57678 * 60;
    totalTime.payPeriod = 17.8979 * 60;

    const job1 = new Job();
    job1.name = "Custodian I";
    job1.totalTime = totalTime;
    job1.clockedIn = true;
    job1.payTypes.push("Regular Hours");
    job1.payTypes.push("On Call");
    job1.payTypes.push("Overtime");

    const wo1 = new WorkOrder();
    wo1.id = "AB-1234";
    wo1.name = "Grass pick up";

    const wo2 = new WorkOrder();
    wo2.id = "OH-3451";
    wo2.name = "Overhead - Sick";

    const wo3 = new WorkOrder();
    wo3.id = "PS-5678-1";
    wo3.name = "Sleeping time";

    job1.currentWorkOrder = wo1;
    job1.availableWorkOrders.push(wo2);
    job1.availableWorkOrders.push(wo3);

    const d1 = new Day();
    d1.time = new Date();
    d1.time.setDate(d1.time.getDate() - 3); // 3 days ago
    d1.hasTimesheetExceptions = false;
    d1.punchedHours = 3.39 * 60;
    d1.otherHours = 0;

    const wob1 = new WorkOrderBilling();
    wob1.workOrder = wo1;
    wob1.billedTime = 3.5 * 60;
    d1.workOrderBillings.push(wob1);

    const wob2 = new WorkOrderBilling();
    wob2.workOrder = wo2;
    wob2.billedTime = 1 * 60;
    d1.workOrderBillings.push(wob2);

    job1.days.push(d1);

    d1.hasWorkOrderExceptions = false;

    jobs.push(job1);

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
