/** Set at build time from SANELLE_API_ORIGIN by scripts/build.mjs, e.g. "https://api.example.com". */
declare const SANELLE_API_ORIGIN: string;

export const environment = {
  // Released builds never show unreviewed health content.
  showDraftContent: false,
  production: true,
  apiBaseUrl: `${SANELLE_API_ORIGIN}/api/v1`,
  hostBaseUrl: SANELLE_API_ORIGIN,
};
