import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'screen-saver',
  templateUrl: './screen-saver.component.html',
  styleUrls: ['./screen-saver.component.scss']
})
export class ScreenSaverComponent implements OnInit {
  timer: Date;
  clock: string;
  weather: string;

  constructor(private router: Router) {
    setInterval(() => {
      this.timer = new Date();
    }, 1000);
  }

  ngOnInit() {
  }

  wakeUp() {
    this.router.navigate(["/login"]);
  }
}
