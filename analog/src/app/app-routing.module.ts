import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { APP_BASE_HREF } from "@angular/common";

import { AppComponent } from "./components/app.component";
import { ClockComponent } from "./components/clock/clock.component";
import { LoginComponent } from "./components/login/login.component";
import { EmployeeResolverService } from "./services/employee-resolver.service";
import { DateResolverService } from "./services/date-resolver.service";
import { JobSelectComponent } from "./components/job-select/job-select.component";
import { DateSelectComponent } from "./components/date-select/date-select.component";
import { DayOverviewComponent } from "./components/day-overview/day-overview.component";
import { ScreenSaverComponent } from "./components/screen-saver/screen-saver.component";

const routes: Routes = [
  {
    path: "",
    redirectTo: "/login",
    pathMatch: "full"
  },
  {
    path: "",
    // component: AppComponent,
    children: [
      {
        path: "screensaver",
        component: ScreenSaverComponent
      },
      {
        path: "login",
        component: LoginComponent
      },
      {
        path: "employee/:id",
        resolve: {
          empRef: EmployeeResolverService
        },
        children: [
          {
            path: "",
            component: ClockComponent
          },
          {
            path: "job",
            children: [
              {
                path: "",
                component: JobSelectComponent
              },
              {
                path: ":jobid/date",
                children: [
                  {
                    path: "",
                    component: DateSelectComponent
                  },
                  {
                    path: ":date",
                    component: DayOverviewComponent,
                    resolve: {
                      date: DateResolverService
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: "/analog"
    }
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
