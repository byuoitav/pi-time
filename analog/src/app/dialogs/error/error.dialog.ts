import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: "error-dialog",
  templateUrl: "./error.dialog.html",
  styleUrls: ["./error.dialog.scss"]
})
export class ErrorDialog implements OnInit {
  constructor(
    public ref: MatDialogRef<ErrorDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      msg: string;
    }
  ) {}

  ngOnInit() {}
}
