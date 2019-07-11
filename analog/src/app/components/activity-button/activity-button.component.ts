import { Component, Input, Output, EventEmitter } from "@angular/core";

export type Action = () => Promise<boolean>;

@Component({
  selector: "activity-button",
  templateUrl: "./activity-button.component.html",
  styleUrls: ["./activity-button.component.scss"]
})
export class ActivityButtonComponent {
  _resolving: boolean;
  _resolved: boolean;
  _error: boolean;

  @Input() disabled: boolean;
  @Input() type: string;
  @Input() click: Action;
  @Input() press: Action;
  @Input() color: string;
  @Input() spinnerColor: string;

  @Output() success: EventEmitter<void>;
  @Output() error: EventEmitter<void>;

  constructor() {
    this.reset();

    this.success = new EventEmitter<void>();
    this.error = new EventEmitter<void>();
  }

  reset() {
    this._resolving = false;
    this._resolved = false;
    this._error = false;
  }

  resolving(): boolean {
    return this._resolving;
  }

  async _do(f: Action) {
    if (this._resolving) {
      return;
    }

    if (!f) {
      console.warn("no function for this action has been defined");
      return;
    }

    this._resolving = true;

    const success = await f();
    if (success) {
      this._resolved = true;
      this._resolving = false;

      setTimeout(() => {
        this.reset();
        this.success.emit();
      }, 750);
    } else {
      this._error = true;

      setTimeout(() => {
        this.reset();
        this.error.emit();
      }, 2000);
    }
  }
}
