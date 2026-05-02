// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The added config here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryEnvironment,
  getTracesSampleRate,
} from "./src/lib/sentry.shared";

const dsn = getSentryDsn();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: getSentryEnvironment(),

  tracesSampleRate: getTracesSampleRate(),

  enableLogs: true,

  sendDefaultPii: true,
});
