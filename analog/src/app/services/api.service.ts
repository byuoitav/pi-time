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
  WorkOrderEntry,
  PunchType,
  TRC,
  JobType
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
    emp.name = "Daniel Randall";

    const jobs = new Array<Job>();
    const totalTime = new TotalTime();

    totalTime.week = "3:57";
    totalTime.payPeriod = "17:42";

    const trc1 = new TRC();
    trc1.id = "REG";
    trc1.description = "Regular";

    const trc2 = new TRC();
    trc2.id = "OT";
    trc2.description = "Overtime";

    const job1 = new Job();
    job1.employeeID = 4502111111111;
    job1.description = "Custodian I";
    job1.subtotals = totalTime;
    job1.isPhysicalFacilities = true;
    job1.jobType = JobType.FullTime;
    job1.clockStatus = PunchType.In;
    job1.trcs.push(trc1);
    job1.trcs.push(trc2);

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
    job1.workOrders.push(wo2);
    job1.workOrders.push(wo3);

    const d1 = new Day();
    d1.time = new Date();
    d1.time.setDate(d1.time.getDate() - 3); // 3 days ago
    d1.hasPunchException = false;
    d1.punchedHours = "3:45";

    const wob1 = new WorkOrderEntry();
    wob1.workOrder = wo1;
    wob1.hoursBilled = "3:30";
    d1.workOrderEntries.push(wob1);

    const wob2 = new WorkOrderEntry();
    wob2.workOrder = wo2;
    wob2.hoursBilled = "1:00";
    d1.workOrderEntries.push(wob2);

    job1.days.push(d1);

    d1.hasWorkOrderException = false;

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
