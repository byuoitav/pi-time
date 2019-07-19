import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private _snackbar: MatSnackBar) { }

  toast = (message: string, action: string, duration: number) => {
    this._snackbar.open(
      message,
      action,
      {
        duration: duration,
        verticalPosition: "bottom"
      }
    )
  }
}
