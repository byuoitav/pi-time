import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material";

@Component({
  selector: "analog",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  constructor(private router: Router, private dialog: MatDialog) {}

  ngOnInit() {
    let count = 0;

    window.addEventListener("click", () => {
      count = 0;
    }, true);

    window.addEventListener("pointerdown", () => {
      count = 0;
    }, true);

    window.addEventListener("scroll", () => {
      count = 0;
    }, true);

    setInterval(() => {
      count++;

      const isLogin = this.router.url.startsWith("/login");
      const isScreensaver = this.router.url.startsWith("/screensaver");

      if (count >= 20 && isLogin) {
        count = 0;

        this.router.navigate(["/screensaver"]);
        this.dialog.closeAll();
      } else if (count >= 15 && !isLogin && !isScreensaver) {
        count = 0;

        this.router.navigate(["/login"]);
        this.dialog.closeAll();
      }
    }, 1000);
  }
}
