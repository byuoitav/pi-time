import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "byuID"
})
export class ByuIDPipe implements PipeTransform {
  transform(val: string): string {
    if (val.length >= 6) {
      return (
        val.slice(0, 2) + "-" + val.slice(2, 5) + "-" + val.slice(5, val.length)
      );
    }

    if (val.length >= 3) {
      return val.slice(0, 2) + "-" + val.slice(2, val.length);
    }

    return val;
  }
}
