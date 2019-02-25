import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import {
  MatToolbarModule,
  MatButtonModule,
  MatGridListModule,
  MatFormFieldModule,
  MatInputModule,
  MatSidenavModule,
  MatIconModule,
  MatCardModule
} from "@angular/material";
import "hammerjs";

import { AppRoutingModule } from "./app-routing.module";

import { APIService } from "./services/api.service";

import { ByuIDPipe } from "./pipes/byu-id.pipe";

import { AppComponent } from "./components/app.component";
import { JobsComponent } from "./components/jobs/jobs.component";
import { LoginComponent } from "./components/login/login.component";
import { LoggedInComponent } from "./components/logged-in/logged-in.component";

@NgModule({
  declarations: [
    AppComponent,
    JobsComponent,
    ByuIDPipe,
    LoginComponent,
    LoggedInComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatIconModule,
    MatCardModule
  ],
  providers: [APIService],
  bootstrap: [AppComponent]
})
export class AppModule {}
