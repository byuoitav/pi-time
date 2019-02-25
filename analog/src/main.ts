import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

(window as any).log = {
  enable: () => {
    // create iframe, steal its console
    const i = document.createElement("iframe");
    i.style.display = "none";
    document.body.appendChild(i);
    (window as any).console = i.contentWindow.console;

    console.log("Logging enabled.");
  },
  disable: () => {
    console.log(
      "Logging is disabled. To enable, call log.enable(), or reload this page with the query parameter of 'log' set to true."
    );

    window.console.log = () => {};
    window.console.info = () => {};
  }
};

if (environment.production) {
  enableProdMode();

  const urlParams = new URLSearchParams(window.location.search);
  if (window && urlParams.get("log") !== "true") {
    (window as any).log.disable();
  } else {
    (window as any).log.enable();
  }
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
