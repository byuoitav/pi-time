import { Component, OnInit, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { PunchType } from 'src/app/objects';

@Component({
  selector: 'confirm-dialog',
  templateUrl: './confirm.dialog.html',
  styleUrls: ['./confirm.dialog.scss']
})
export class ConfirmDialog implements OnInit {
  constructor(
    public ref: MatDialogRef<ConfirmDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      state: string
    }
  ) {
    this.ref.disableClose = true;
  }

  ngOnInit() {}

  close = () => {
    this.ref.close();
  };

  confirmed = () => {
    this.ref.close("confirmed");
  }
}
