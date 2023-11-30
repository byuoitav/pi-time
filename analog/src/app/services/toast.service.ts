import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
  providedIn: "root"
})
export class ToastService {
  constructor(private _snackbar: MatSnackBar) {}

  show = (message: string, action: string, duration: number) => {
    this._snackbar.open(message, action, {
      duration: duration,
      verticalPosition: "bottom",
      panelClass: "dismiss"
    });
  };

  showIndefinitely = (message: string, action: string, red?: boolean) => {
    if (red) {
      this._snackbar.open(message, action, {
        verticalPosition: "bottom",
        panelClass: ['red-snackbar']
      })
    } else {
      this._snackbar.open(message, action, {
        verticalPosition: "bottom"
      });
    }
  };
}