import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  MatToolbarModule,
  MatButtonModule,
  MatGridListModule,
  MatFormFieldModule,
  MatInputModule,
  MatSidenavModule,
  MatIconModule,
  MatCardModule,
  MatDividerModule,
  MatDialogModule,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatSelectModule,
  MatNativeDateModule,
  MatDatepickerModule
} from "@angular/material";
import "hammerjs";

import { AppRoutingModule } from "./app-routing.module";

import { APIService } from "./services/api.service";

import { ByuIDPipe } from "./pipes/byu-id.pipe";

import { AppComponent } from "./components/app.component";
import { JobsComponent } from "./components/jobs/jobs.component";
import { LoginComponent } from "./components/login/login.component";
import { LoggedInComponent } from "./components/logged-in/logged-in.component";
import { HoursPipe } from "./pipes/hours.pipe";
import { ChangeWoDialog } from "./dialogs/change-wo/change-wo.dialog";
import { WorkOrdersComponent } from "./components/work-orders/work-orders.component";
import { JobTimeSelectComponent } from "./components/job-time-select/job-time-select.component";

@NgModule({
  declarations: [
    AppComponent,
    JobsComponent,
    ByuIDPipe,
    LoginComponent,
    LoggedInComponent,
    HoursPipe,
    ChangeWoDialog,
    WorkOrdersComponent,
    JobTimeSelectComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatDialogModule,
    MatSelectModule,
    MatNativeDateModule,
    MatDatepickerModule
  ],
  providers: [
    APIService,
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: true
      }
    }
  ],
  entryComponents: [ChangeWoDialog],
  bootstrap: [AppComponent]
})
export class AppModule {}
