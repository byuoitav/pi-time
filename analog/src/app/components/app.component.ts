import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";

@Component({
  selector: "analog",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  ssCounter = 0;
  ssTimer: any;

  constructor(private router: Router) {}

  ngOnInit() {
    document.body.addEventListener("click", () => {
      this.ssCounter = 0;
    }, true);

    this.ssTimer = setInterval(() => {
      this.ssCounter++;

      const isLogin = this.router.url === "/login"
      const isScreensaver = this.router.url === "/screensaver"

      if (this.ssCounter >= 20 && isLogin) {
        this.ssCounter = 0;
        this.router.navigate(["/screensaver"]);
      } else if (this.ssCounter >= 10 && !isLogin && !isScreensaver) {
        this.ssCounter = 0;
        this.router.navigate(["/login"]);
      }
    }, 1000);
  }
}
