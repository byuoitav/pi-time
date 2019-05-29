import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "hours"
})
export class HoursPipe implements PipeTransform {
  transform(val: number): string {
    if (val == null || val === undefined) {
      return "--:--";
    }

    // just assume val is hours in minutes
    const rounded = (val / 60).toFixed(2);

    // create string, replace . with :
    let str = rounded.toString();
    str = str.replace(".", ":");

    return str;
  }
}
