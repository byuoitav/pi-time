import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { APP_BASE_HREF } from "@angular/common";

import { AppComponent } from "./components/app.component";
import { ClockComponent } from "./components/clock/clock.component";
import { LoginComponent } from "./components/login/login.component";
import { WorkOrdersComponent } from "./components/work-orders/work-orders.component";
import { EmployeeResolverService } from "./services/employee-resolver.service";
import { JobSelectComponent } from "./components/job-select/job-select.component";
import { DateSelectComponent } from "./components/date-select/date-select.component";
import { DayOverviewComponent } from "./components/day-overview/day-overview.component";

const routes: Routes = [
  {
    path: "",
    redirectTo: "/login",
    pathMatch: "full"
  },
  {
    path: "",
    component: AppComponent,
    children: [
      {
        path: "login",
        component: LoginComponent
      },
      {
        path: "employee/:id",
        resolve: {
          employee: EmployeeResolverService
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
                path: ":job/date",
                children: [
                  {
                    path: "",
                    component: DateSelectComponent
                  },
                  {
                    path: ":date",
                    component: DayOverviewComponent
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
      useValue: "/"
    }
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
