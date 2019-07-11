import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { APIService } from "../../services/api.service";
import { Employee } from "../../objects";

@Component({
  selector: "login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit {
  id = "666567890";

  constructor(public api: APIService, private router: Router) {}

  ngOnInit() {}

  addToID(num: string) {
    if (this.id.length < 9) {
      this.id += num;
    }
  }

  delFromID() {
    if (this.id.length > 0) {
      this.id = this.id.slice(0, -1);
    }
  }

  login = async (id: string) => {
    console.log("navigating to jobs with id", this.id);
    const success = await this.router.navigate(["/employee/" + this.id]);

    this.id = ""; // reset the id
  };
}
