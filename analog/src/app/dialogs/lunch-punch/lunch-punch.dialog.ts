import { Component, OnInit, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Overlay } from '@angular/cdk/overlay';
import { Observable } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'lunch-punch-dialog',
  templateUrl: './lunch-punch.dialog.html',
  styleUrls: ['./lunch-punch.dialog.scss']
})
export class LunchPunchDialog implements OnInit {
  selectedStartTime: string;
  selectedDuration: string;

  constructor(
    public ref: MatDialogRef<LunchPunchDialog>,
    private _overlay: Overlay,
    private _injector: Injector,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      submit: (startTime: string, duration: string) => Observable<any>;
    },
    private _toast: ToastService
  ) { }

  ngOnInit() {
  }

  cancel() {
    this.ref.close(true);
  }

  submit = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      console.log("submitting lunch punch with start time of ", this.selectedStartTime, "and duration of ", this.selectedDuration);
      this.data.submit(this.selectedStartTime, this.selectedDuration).subscribe(
        data => {
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
    this._toast.toast("Lunch Punch Recorded", "dismiss", 2000);
  }
}
