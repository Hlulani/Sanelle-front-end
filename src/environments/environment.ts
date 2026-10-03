// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // Show records marked as demo data, and evidence topics that haven't been clinically reviewed.
  showDemoRecords: true,
  showDraftContent: true,
  production: false,
  // localhost works here because the iOS Simulator shares the Mac's network stack directly.
  // A physical device can't reach "localhost" this way (it resolves to the device itself,
  // not the Mac) — that needs the Mac's LAN IP instead, found via `ipconfig getifaddr en0`.
  apiBaseUrl: 'http://localhost:8080/api/v1',
  hostBaseUrl: 'http://localhost:8080',
  forceAuthOnStart: true
};


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
