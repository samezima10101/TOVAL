// Public build marker, never a secret or a server authorization mechanism.
export const DEBUG_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_APP_ENV === "internal";
export const BUILD_ENVIRONMENT = __DEV__ ? "development" : DEBUG_ENABLED ? "internal" : "external";
