import { InjectionToken } from "@angular/core";
import {
  JsonObject,
  JsonProperty,
  Any,
  JsonConverter,
  JsonCustomConvert
} from "json2typescript";

export const PORTAL_DATA = new InjectionToken<{}>("PORTAL_DATA");

export enum PunchType {
  In = "I",
  Out = "O",
  Transfer = "T"
}

export namespace PunchType {
  export function toString(pt: PunchType | String): String {
    switch (pt) {
      case PunchType.In:
        return "IN";
      case PunchType.Out:
        return "OUT";
      case PunchType.Transfer:
        return "TRANSFER";
      default:
        return pt.toString();
    }
  }

  export function toNormalString(pt: PunchType | String): String {
    switch (pt) {
      case PunchType.In:
        return "In";
      case PunchType.Out:
        return "Out";
      case PunchType.Transfer:
        return "Transfer";
      default:
        return pt.toString();
    }
  }

  export function reverse(pt: PunchType): PunchType {
    switch (pt) {
      case PunchType.In:
        return PunchType.Out;
      case PunchType.Out:
        return PunchType.In;
      default:
        return pt;
    }
  }

  export function fromString(s: string | String): PunchType {
    switch (s) {
      case "I":
        return PunchType.In;
      case "O":
        return PunchType.Out;
      case "T":
        return PunchType.Transfer;
      default:
        return;
    }
  }
}

export enum JobType {
  FullTime = "F",
  PartTime = "P"
}

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
  serialize(date: Date): any {
    if (!date) {
      return "0001-01-01T00:00:00Z";
    }

    const pad = n => {
      return n < 10 ? "0" + n : n;
    };

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
    if (!date || date === "0001-01-01T00:00:00Z") {
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
    } else if (this._time.length <= 2) {
      return "--:" + this._time;
    }

    if (this._time.length <= 2) {
      return "--:" + this._time;
    }

    if (this._time.length > 2) {
      return this._time.substring(0, 2) + ":" + this._time.substring(2);
    }
  }
  set time(s: string) {
    if (s.includes(":")) {
      s = s.replace(":", "");
    }

    this._time = s.substring(0, 4);
  }

  public toString = (): string => {
    return this.time;
  };

  constructor(s: string) {
    this.time = s;
  }
}

@JsonObject("TRC")
export class TRC {
  @JsonProperty("id", String, true)
  id: string = undefined;

  @JsonProperty("description", String, true)
  description: string = undefined;
}

@JsonObject("TotalTime")
export class TotalTime {
  @JsonProperty("week", String, true)
  week: string = undefined;

  @JsonProperty("pay-period", String, true)
  payPeriod: string = undefined;
}

@JsonObject("WorkOrder")
export class WorkOrder {
  @JsonProperty("id", String, true)
  id: string = undefined;

  @JsonProperty("name", String, true)
  name: string = undefined;

  toString = (): string => {
    return this.id + ": " + this.name;
  };
}

@JsonObject("Punch")
export class Punch {
  @JsonProperty("id", Number, true)
  id: number = undefined;

  @JsonProperty("employee-job-id", Number, true)
  employeeJobID: number = undefined;

  @JsonProperty("time", DateConverter, true)
  time: Date = undefined;

  @JsonProperty("type", String, true)
  type: String = undefined;

  @JsonProperty("deletable-pair", Number, true)
  deletablePair: number = undefined;

  editedTime: string = undefined;
  editedAMPM: string = undefined;
}

@JsonObject("WorkOrderEntry")
export class WorkOrderEntry {
  @JsonProperty("id", Number, true)
  id: number = undefined;

  @JsonProperty("work-order", WorkOrder, true)
  workOrder: WorkOrder = undefined;

  @JsonProperty("time-reporting-code-hours", String, true)
  timeReportingCodeHours: string = undefined;

  @JsonProperty("trc", TRC, true)
  trc: TRC = undefined;

  @JsonProperty("editable", Boolean, true)
  editable: boolean = undefined;
}

@JsonObject("OtherHour")
export class OtherHour {
  @JsonProperty("editable", Boolean)
  editable: boolean = undefined;

  @JsonProperty("sequence-number", Number)
  sequenceNumber: number = undefined;

  @JsonProperty("time-reporting-code-hours", String)
  timeReportingCodeHours: string = undefined;

  @JsonProperty("trc", TRC)
  trc: TRC = undefined;
}

@JsonObject("Day")
export class Day {
  @JsonProperty("date", DateConverter, false)
  time: Date = undefined;

  @JsonProperty("has-punch-exception", Boolean, true)
  hasPunchException: boolean = undefined;

  @JsonProperty("has-work-order-exception", Boolean, true)
  hasWorkOrderException: boolean = undefined;

  @JsonProperty("punched-hours", String, false)
  punchedHours: string = undefined;

  @JsonProperty("physical-facilities-hours", String, true)
  physicalFacilitiesHours: string = undefined;

  @JsonProperty("reported-hours", String, true)
  reportedHours: string = undefined;

  @JsonProperty("punches", [Punch], true)
  punches: Punch[] = Array<Punch>();

  @JsonProperty("work-order-entries", [WorkOrderEntry], true)
  workOrderEntries: Array<WorkOrderEntry> = new Array<WorkOrderEntry>();

  @JsonProperty("other-hours", [OtherHour], true)
  otherHours: Array<OtherHour> = new Array<OtherHour>();

  @JsonProperty("sick-hours-ytd", String, true)
  sickHoursYTD: string = undefined;

  @JsonProperty("vacation-hours-ytd", String, true)
  vacationHoursYTD: string = undefined;

  public static minDay<T extends Day>(days: T[]): Day {
    if (days == null) {
      return;
    }

    let minimum: Day;
    const today = new Day();
    today.time = new Date();
    minimum = today;

    for (const d of days) {
      if (d.time.getTime() < minimum.time.getTime()) {
        minimum = d;
      }
    }

    if (minimum.time.getTime() === today.time.getTime()) {
      return days[0];
    }

    return minimum;
  }

  public static maxDay<T extends Day>(days: T[]): Day {
    if (days == null) {
      return;
    }

    let maximum: Day;
    const today = new Day();
    today.time = new Date();
    maximum = today;

    for (const d of days) {
      if (d.time.getTime() > maximum.time.getTime()) {
        maximum = d;
      }
    }

    if (maximum.time.getTime() === today.time.getTime()) {
      return days[days.length - 1];
    }

    return maximum;
  }
}

@JsonObject("Job")
export class Job {
  @JsonProperty("employee-job-id", Number, true)
  employeeJobID: Number = undefined;

  @JsonProperty("description", String, true)
  description: string = undefined;

  @JsonProperty("time-subtotals", TotalTime, true)
  subtotals: TotalTime = undefined;

  // TODO PunchType
  @JsonProperty("clock-status", String, true)
  clockStatus: String = undefined;

  // TODO JobType
  @JsonProperty("job-type", String, true)
  jobType: String = undefined;

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

  @JsonProperty("has-punch-exception", Boolean, true)
  hasPunchException: boolean = undefined;

  @JsonProperty("has-work-order-exception", Boolean, true)
  hasWorkOrderException: boolean = undefined;

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
    if (!this.currentWorkOrder) {
      return false;
    }

    return this.clockStatus === PunchType.In;
  };
}

@JsonObject("Employee")
export class Employee {
  @JsonProperty("id", String, false)
  id: string = undefined;

  @JsonProperty("name", String, false)
  name: string = undefined;

  @JsonProperty("jobs", [Job], true)
  jobs: Array<Job> = new Array<Job>();

  @JsonProperty("total-time", TotalTime, true)
  totalTime: TotalTime = undefined;

  @JsonProperty("international-message", String, true)
  message: String = undefined;

  showTRC = (): boolean => {
    for (const job of this.jobs) {
      if (job.showTRC()) {
        return true;
      }
    }

    return false;
  };
}

@JsonObject("ClientPunchRequest")
export class ClientPunchRequest {
  @JsonProperty("byu-id", Number)
  byuID: Number;

  @JsonProperty("employee-job-id", Number)
  jobID: Number;

  @JsonProperty("time", DateConverter)
  time: Date;

  @JsonProperty("type", String)
  type: String;

  @JsonProperty("work-order-id", String, true)
  workOrderID: String;

  @JsonProperty("trc-id", String, true)
  trcID: String;
}

@JsonObject("LunchPunch")
export class LunchPunch {
  @JsonProperty("start_time", String)
  startTime: string;

  @JsonProperty("duration", String)
  duration: string;

  @JsonProperty("employee_record", Number, true)
  employeeRecord: number;

  @JsonProperty("punch_date", String, true)
  punchDate: string;

  @JsonProperty("time_collection_source", String, true)
  timeCollectionSource: string;

  @JsonProperty("punch_zone", String, true)
  punchZone: string;

  @JsonProperty("location_description", String, true)
  locationDescription: string;
}

@JsonObject("DeletePunch")
export class DeletePunch {
  @JsonProperty("punch-type", String)
  punchType: PunchType;

  @JsonProperty("punch-date", String)
  punchDate: string;

  @JsonProperty("punch-time", String)
  punchTime: string;

  @JsonProperty("sequence-number", Number, true)
  sequenceNumber: number;
}

@JsonObject("OtherHourRequest")
export class OtherHourRequest {
  @JsonProperty("employee-job-id", Number)
  jobID: number;

  @JsonProperty("time-reporting-code-hours", String)
  timeReportingCodeHours: string;

  @JsonProperty("punch-date", DateConverter)
  punchDate: string;

  @JsonProperty("trc-id", String)
  trcID: string;
}

@JsonObject("DeleteWorkOrder")
export class DeleteWorkOrder {
  @JsonProperty("employee-job-id", Number)
  jobID: number;

  @JsonProperty("date", String)
  date: string;

  @JsonProperty("sequence-number", Number)
  sequenceNumber: number;
}
