import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'

import { routes } from './app.routes'

// Incremental hydration adds an event replay inline script,
// which the script-src 'self' CSP blocks.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withNoIncrementalHydration()),
  ],
}
