import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnInit
} from "@angular/core";

const LOW = 3;
const REDIRECT: string =
  "http://" + window.location.hostname + ":10000/dashboard";

@Component({
  selector: "management",
  templateUrl: "./management.component.html",
  styleUrls: ["./management.component.scss"]
})
export class ManagementComponent implements OnChanges, OnInit {
  @Input()
  enabled: boolean;

  defcon: number;

  constructor() {
    this.reset();
  }

  ngOnInit() {
    this.reset();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.reset();
  }

  update(level: number) {
    console.log("defcon", this.defcon);
    switch (level) {
      case LOW:
        if (this.defcon === LOW) {
          this.defcon--;
        } else {
          this.reset();
        }
        break;
      case LOW - 1:
        if (this.defcon === LOW - 1) {
          this.defcon--;
        } else {
          this.reset();
        }
        break;
      case LOW - 2:
        if (this.defcon === LOW - 2) {
          this.defcon--;
        } else {
          this.reset();
        }
        break;
      case 0:
        if (this.defcon === 0) {
          console.log("redirecting to dashboard", REDIRECT);
          location.assign(REDIRECT);
        } else {
          this.reset();
        }
        break;
    }
  }

  reset() {
    this.defcon = LOW;
  }
}