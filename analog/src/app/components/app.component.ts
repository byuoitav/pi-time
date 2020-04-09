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
    window.addEventListener("click", () => {
      this.ssCounter = 0;
    }, true);

    window.addEventListener("scroll", () => {
      this.ssCounter = 0;
    }, true);

    this.ssTimer = setInterval(() => {
      this.ssCounter++;

      const isLogin = this.router.url.startsWith("/login");
      const isScreensaver = this.router.url.startsWith("/screensaver");

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
