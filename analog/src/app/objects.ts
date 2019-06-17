import {
  JsonObject,
  JsonProperty,
  Any,
  JsonConverter,
  JsonCustomConvert
} from "json2typescript";

export enum PunchType {
  In = "I",
  Out = "O"
}

export enum JobType {
  FullTime = "F",
  PartTime = "P"
}

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

export class Hours {
  private _time: string;
  get time(): string {
    if (!this._time || this._time.length <= 0 || this._time.length > 4) {
      return "--:--";
    }

    if (this._time.length <= 2) {
      return "--:" + this._time;
    }

    if (this._time.length > 2) {
      return this._time.substring(0, 2) + ":" + this._time.substring(2);
    }
  }
  set time(s: string) {}

  constructor(s: string) {
    this._time = s;
  }
}

export class TRC {
  @JsonProperty("id", String, true)
  id: string = undefined;

  @JsonProperty("description", String, true)
  description: string = undefined;
}

@JsonObject("TotalTime")
export class TotalTime {
  @JsonProperty("week", Hours, true)
  week: Hours = undefined;

  @JsonProperty("pay-period", Hours, true)
  payPeriod: Hours = undefined;
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
  @JsonProperty("id", Number, true)
  id: number = undefined;

  @JsonProperty("employee-id", Number, true)
  employeeID: number = undefined;

  @JsonProperty("time", DateConverter, true)
  time: Date = undefined;

  @JsonProperty("type", PunchType, true)
  type: PunchType = undefined;

  @JsonProperty("deletable-pair", Number, true)
  deletablePair: number = undefined;
}

@JsonObject("WorkOrderEntry")
export class WorkOrderEntry {
  @JsonProperty("id", Number, true)
  id: number = undefined;

  @JsonProperty("work-order", WorkOrder, true)
  workOrder: WorkOrder = undefined;

  @JsonProperty("hours-billed", Hours, true)
  hoursBilled: Hours = undefined;

  @JsonProperty("trc", TRC, true)
  trc: TRC = undefined;

  @JsonProperty("editable", Boolean, true)
  editable: boolean = undefined;
}

@JsonObject("Day")
export class Day {
  @JsonProperty("date", DateConverter, true)
  time: Date = undefined;

  @JsonProperty("has-punch-exception", Boolean, true)
  hasPunchException: boolean = undefined;

  @JsonProperty("has-work-order-exception", Boolean, true)
  hasWorkOrderException: boolean = undefined;

  @JsonProperty("punched-hours", Hours, true)
  punchedHours: Hours = undefined;

  @JsonProperty("billed-hours", Hours, false)
  billedHours: Hours = undefined;

  @JsonProperty("reported-hours", Hours, false)
  reportedHours: Hours = undefined;

  @JsonProperty("punches", [Punch], true)
  punches: Punch[] = Array<Punch>();

  @JsonProperty("work-order-entries", [WorkOrderEntry], true)
  workOrderEntries: Array<WorkOrderEntry> = new Array<WorkOrderEntry>();

  // sick/vacation, YTD sick/vacation
  @JsonProperty("sick-hours", Hours, false)
  sickHours: Hours = undefined;

  @JsonProperty("vacation-hours", Hours, false)
  vacationHours: Hours = undefined;

  @JsonProperty("sick-hours-ytd", Hours, false)
  sickHoursYTD: Hours = undefined;

  @JsonProperty("vacation-hours-ytd", Hours, false)
  vacationHoursYTD: Hours = undefined;
}

@JsonObject("Job")
export class Job {
  @JsonProperty("employee-id", Number, true)
  employeeID: Number = undefined;

  @JsonProperty("description", String, true)
  description: string = undefined;

  @JsonProperty("time-subtotals", TotalTime, true)
  subtotals: TotalTime = undefined;

  @JsonProperty("clock-status", PunchType, true)
  clockStatus: PunchType = undefined;

  @JsonProperty("job-type", JobType, true)
  jobType: JobType = undefined;

  @JsonProperty("is-physical-facilities", Boolean, true)
  isPhysicalFacilities: Boolean = undefined;

  @JsonProperty("trcs", [TRC], true)
  trcs: Array<TRC> = new Array<TRC>();

  @JsonProperty("current-trc", TRC, false)
  currentTRC: TRC = undefined;

  @JsonProperty("work-orders", [WorkOrder], true)
  workOrders: Array<WorkOrder> = new Array<WorkOrder>();

  @JsonProperty("current-work-order", WorkOrder, true)
  currentWorkOrder: WorkOrder = undefined;

  @JsonProperty("days", [Day], true)
  days: Array<Day> = new Array<Day>();

  showTRC = (): boolean => {
    return (
      this.isPhysicalFacilities &&
      this.jobType === JobType.FullTime &&
      this.clockStatus === PunchType.In
    );
  };

  showWorkOrder = (): boolean => {
    return true;
  };
}

@JsonObject("Employee")
export class Employee {
  @JsonProperty("name", String, true)
  name: string = undefined;

  @JsonProperty("jobs", [Job], true)
  jobs: Array<Job> = new Array<Job>();

  @JsonProperty("total-time", TotalTime, true)
  totalTime: TotalTime = undefined;

  @JsonProperty("international-message", String, false)
  message: String = undefined;
}
