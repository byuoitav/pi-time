import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewEncapsulation
} from "@angular/core";

class ActivityButtonBase {
  constructor(public _elementRef: ElementRef) {}
}

export type Action = () => Promise<boolean>;

@Component({
  selector: `button[activity-button]`,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ["./activity-button.component.scss"],
  templateUrl: "./activity-button.component.html",
  host: {
    class: "activity-button",
    "[class.mat-button]": "!type || type === 'mat-button'",
    "[class.mat-raised-button]": "type === 'mat-raised-button'",
    "[class.mat-stroked-button]": "type === 'mat-stroked-button'",
    "[class.mat-flat-button]": "type === 'mat-flat-button'",
    "[class.mat-icon-button]": "type === 'mat-icon-button'",
    "[class.mat-primary]": "color === 'primary'",
    "[class.mat-accent]": "color === 'accent'",
    "[class.mat-warn]": "color === 'warn'",
    "[class.activity-button-success]": "_resolved",
    "[class.activity-button-error]": "_error"
  }
})
export class ActivityButton extends ActivityButtonBase {
  _resolving: boolean;
  _resolved: boolean;
  _error: boolean;

  @Input() disabled: boolean;
  @Input() disableRipple: boolean;
  @Input() type: string;
  @Input() click: Action;
  @Input() press: Action;
  @Input() color: string;
  @Input() spinnerColor: string;
  @Input() spinnerDiameter: number;

  @Output() success: EventEmitter<void>;
  @Output() error: EventEmitter<void>;

  readonly isRoundButton: boolean = this._hasHostAttributes(
    "mat-fab",
    "mat-mini-fab"
  );
  readonly isIconButton: boolean = this._hasHostAttributes("mat-icon-button");

  constructor(elementRef: ElementRef) {
    super(elementRef);
    this.reset();

    this.spinnerColor = "warn";

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

  _getHostElement() {
    return this._elementRef.nativeElement;
  }

  _isRippleDisabled() {
    return this.disableRipple || this.disabled;
  }

  _hasHostAttributes(...attributes: string[]) {
    return attributes.some(attribute =>
      this._getHostElement().hasAttribute(attribute)
    );
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
      }, 750);
    }
  }
}
