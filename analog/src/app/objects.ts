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
export class DateConverter implements JsonCustomConvert<Date> {
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
  deserialize(dateString: any): Date {
    if (!dateString || dateString === "0001-01-01T00:00:00Z") {
      return undefined;
    }
  
    // Extract date components using a regular expression
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.000 ([\+\-]\d{4})$/);
  
    if (match) {
      const [, year, month, day, hours, minutes, seconds, offset] = match;
      const utcOffset = parseInt(offset) / 100; // Convert offset to hours
      const utcMilliseconds = Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );
  
      // Adjust for UTC offset
      const localMilliseconds = utcMilliseconds - utcOffset * 60 * 60 * 1000;
      const localDate = new Date(localMilliseconds);
  
      return localDate;
    }
  
    // Return undefined if the format is not recognized
    return undefined;
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

@JsonObject("Punch")
export class Punch {
  @JsonProperty("position_number", String, true)
  positionNumber: number = undefined;

  @JsonProperty("business_title", String, true)
  businessTitle: String = undefined;

  @JsonProperty("clock_event_type", String, true)
  type: String = undefined;

  @JsonProperty("time_clock_event_date_time", DateConverter, true)
  time: Date = undefined;
}

@JsonObject("Day")
export class Day {
  @JsonProperty("date", DateConverter, false)
  time: Date = undefined;

  @JsonProperty("punched-hours", String, false)
  punchedHours: string = "1212";

  @JsonProperty("reported-hours", String, true)
  reportedHours: string = "1212";

  @JsonProperty("punches", [Punch], true)
  punches: Punch[] = Array<Punch>();

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

@JsonObject("Position")
export class Position {
 @JsonProperty('position_number', String)
 positionNumber: number = undefined;

 @JsonProperty('primary_position', String)
 primaryPosition: boolean = undefined;

 @JsonProperty('business_title')
 businessTitle: string = undefined;

 @JsonProperty('position_total_week_hours', String)
 totalWeekHours: number = undefined;

 @JsonProperty('position_total_period_hours', String)
 totalPeriodHours: number = undefined;

 inStatus: boolean = undefined;
 days = Array<Day>();

}

@JsonObject("Employee")
export class Employee {
  id: string = undefined;
  @JsonProperty("employee_name", String, false)
  name: string = undefined;
  @JsonProperty("total_week_hours", String, false)
  totalWeekHours: string = undefined;

  @JsonProperty("total_period_hours", String, false)
  totalPeriodHours: string = undefined;

  @JsonProperty('time_entry_codes', Object)
  timeEntryCodes: { [key: string]: string } = undefined;

  @JsonProperty('positions', [Position])
  positions: Position[] = undefined; 

  @JsonProperty("period_punches", [Punch], false)
  periodPunches: Punch[] = undefined;

  showTRC = (): boolean => {
    return false;
  }
}



@JsonObject("ClientPunchRequest")
export class ClientPunchRequest {
  @JsonProperty("byu-id", String)
  byuID: String;

  @JsonProperty("employee-job-id", Number)
  jobID: Number;

  @JsonProperty("sequence-number", Number, true)
  sequenceNumber: Number;

  @JsonProperty("time", DateConverter)
  time: Date;

  @JsonProperty("type", String)
  type: String;

  @JsonProperty("work-order-id", String, true)
  workOrderID: String;

  @JsonProperty("trc-id", String, true)
  trcID: String;
}




