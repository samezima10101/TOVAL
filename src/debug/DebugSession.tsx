import { createContext, useContext } from "react";

export const DEBUG_STORAGE_KEY = "@my-june/debug/app-state-v1";

export const DebugSessionContext = createContext({
  sandbox: false,
  setSandbox: (_enabled: boolean) => {},
});

export function useDebugSession() {
  return useContext(DebugSessionContext);
}
