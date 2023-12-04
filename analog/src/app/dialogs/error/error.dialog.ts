import { Component, OnInit, Inject } from "@angular/core";
import { MatLegacyDialogRef as MatDialogRef } from "@angular/material/legacy-dialog";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from "@angular/material/legacy-dialog";

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
