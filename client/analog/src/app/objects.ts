import {
  JsonObject,
  JsonProperty,
  Any,
  JsonConverter,
  JsonCustomConvert
} from "json2typescript";

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
  serialize(date: Date): any {
    function pad(n) {
      return n < 10 ? "0" + n : n;
    }

    return (
      date.getUTCFullYear() +
      "-" +
      pad(date.getUTCMonth() + 1) +
      "-" +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      ":" +
      pad(date.getUTCMinutes()) +
      ":" +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  }

  deserialize(date: any): Date {
    if (date == null) {
      return undefined;
    }

    return new Date(date);
  }
}

@JsonObject("TotalTime")
export class TotalTime {
  @JsonProperty("week", Number, true)
  week: number = undefined;

  @JsonProperty("pay-period", Number, true) payPeriod: number = undefined;
}

@JsonObject("WorkOrder")
export class WorkOrder {
  @JsonProperty("id", String, true)
  id: string = undefined;

  @JsonProperty("name", String, true)
  name: string = undefined;
}

@JsonObject("Punch")
export class Punch {
  @JsonProperty("in-time", DateConverter, true)
  time: Date = undefined;

  @JsonProperty("type", String, true)
  type: string = undefined;

  @JsonProperty("exception-type", String, true)
  exceptionType: string = undefined;

  @JsonProperty("name", String, true)
  name: string = undefined;
}

@JsonObject("WorkOrderBilling")
export class WorkOrderBilling {
  @JsonProperty("work-order", WorkOrder, true)
  workOrder: WorkOrder = undefined;

  @JsonProperty("billed-time", Number, true)
  billedTime: number = undefined;
}

@JsonObject("Day")
export class Day {
  @JsonProperty("date", DateConverter, true)
  time: Date = undefined;

  @JsonProperty("has-time-sheet-exceptions", Boolean, true)
  hasTimesheetExceptions: boolean = undefined;

  @JsonProperty("punched-hours", Number, true)
  punchedHours: number = undefined;

  @JsonProperty("other-hours", Number, true)
  otherHours: number = undefined;

  @JsonProperty("punches", [Punch], true)
  punches: Punch[] = Array<Punch>();

  @JsonProperty("has-work-order-exceptions", Boolean, true)
  hasWorkOrderExceptions: boolean = undefined;

  @JsonProperty("work-order-billings", [WorkOrderBilling], true)
  workOrderBillings: Array<WorkOrderBilling> = new Array<WorkOrderBilling>();
}

@JsonObject("Job")
export class Job {
  @JsonProperty("name", String, true)
  name: string = undefined;

  @JsonProperty("total-time", TotalTime, true)
  totalTime: TotalTime = undefined;

  @JsonProperty("clocked-in", Boolean, true)
  clockedIn: boolean = undefined;

  @JsonProperty("pay-types", [String], true)
  payTypes: Array<string> = new Array<string>();

  @JsonProperty("current-work-order", WorkOrder, true)
  currentWorkOrder: WorkOrder = undefined;

  @JsonProperty("available-work-orders", [WorkOrder], true)
  availableWorkOrders: Array<WorkOrder> = new Array<WorkOrder>();

  @JsonProperty("days", [Day], true)
  days: Array<Day> = new Array<Day>();
}

@JsonObject("Employee")
export class Employee {
  @JsonProperty("id", String, true)
  id: string = undefined;

  @JsonProperty("name", String, true)
  name: string = undefined;

  @JsonProperty("jobs", [Job], true)
  jobs: Array<Job> = new Array<Job>();

  @JsonProperty("total-time", TotalTime, true)
  totalTime: TotalTime = undefined;

  @JsonProperty("show-work-orders", Boolean, true)
  showWorkOrders: boolean = undefined;
}
