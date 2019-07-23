import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Observable } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
import { Punch } from 'src/app/objects';

@Component({
  selector: 'delete-punch-dialog',
  templateUrl: './delete-punch.dialog.html',
  styleUrls: ['./delete-punch.dialog.scss']
})
export class DeletePunchDialog implements OnInit {

  constructor(
    public ref: MatDialogRef<DeletePunchDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      punch: Punch
      submit: (yes: boolean) => Observable<any>;
    },
    private _toast: ToastService
  ) { }

  ngOnInit() {
  }

  cancel() {
    this.ref.close();
  }

  submit = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      console.log("deleting punch", this.data.punch);
      this.data.submit(true).subscribe(
        resp => {
          resolve(true);
        },
        err => {
          resolve(false);
        }
      );
    });
  };

  success = () => {
    this.ref.close();
    this._toast.show("Punch deleted", "DISMISS", 2000);
  }
}
