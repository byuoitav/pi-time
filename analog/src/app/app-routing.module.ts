import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { APP_BASE_HREF } from "@angular/common";

import { AppComponent } from "./components/app.component";
import { JobsComponent } from "./components/jobs/jobs.component";
import { LoginComponent } from "./components/login/login.component";
import { LoggedInComponent } from "./components/logged-in/logged-in.component";
import { WorkOrdersComponent } from "./components/work-orders/work-orders.component";
import { EmployeeResolverService } from "./services/employee-resolver.service";

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
        path: "employees/:id",
        component: LoggedInComponent,
        resolve: {
          employee: EmployeeResolverService
        },
        children: [
          {
            path: "jobs",
            component: JobsComponent
          },
          {
            path: "workorders",
            component: WorkOrdersComponent
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
