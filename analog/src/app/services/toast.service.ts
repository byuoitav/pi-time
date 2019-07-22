import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private _snackbar: MatSnackBar) { }

  show = (message: string, action: string, duration: number) => {
    this._snackbar.open(
      message,
      action,
      {
        duration: duration,
        verticalPosition: "bottom"
      }
    )
  }

  showIndefinitely = (message: string, action: string) => {
    this._snackbar.open(
      message,
      action,
      {
        verticalPosition: "bottom"
      }
    )
  }
}
