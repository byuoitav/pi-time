import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

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
  ) {
    this.ref.disableClose = true;
  }

  ngOnInit() {}

  close = () => {
    this.ref.close();
  };
}
