import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material";

@Component({
  selector: "analog",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  ssCounter = 0;
  ssTimer: any;

  constructor(private router: Router, private dialog: MatDialog) {}

  ngOnInit() {
    document.body.addEventListener("click", () => {
      this.ssCounter = 0;
    }, true);

    this.ssTimer = setInterval(() => {
      this.ssCounter++;

      console.log("this.router.url", this.router.url);
      const isLogin = this.router.url.startsWith("/login");
      const isScreensaver = this.router.url.startsWith("/screensaver");

      console.log("counter", this.ssCounter, "isLogin", isLogin, "isScreensaver", isScreensaver);

      if (this.ssCounter >= 20 && isLogin) {
        this.ssCounter = 0;

        this.router.navigate(["/screensaver"]);
        this.dialog.closeAll();
      } else if (this.ssCounter >= 10 && !isLogin && !isScreensaver) {
        this.ssCounter = 0;

        this.router.navigate(["/login"]);
        this.dialog.closeAll();
      }
    }, 1000);
  }
}
