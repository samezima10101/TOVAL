// DEBUG_CENTER: dedicated mutation access; never exposed by the normal Context API.
import { createContext, useContext, type ReactNode } from "react";

import type { AppState } from "@/src/domain/common/types";
import { DEBUG_ENABLED } from "@/src/config/environment";
import { useDebugSession } from "./DebugSession";

export type DebugStateProviderProps = {
  children: ReactNode;
  updateState: (transform: (current: AppState) => AppState) => Promise<void>;
};

const DebugStateContext = createContext<DebugStateProviderProps["updateState"] | null>(null);

export function DebugStateProvider({ children, updateState }: DebugStateProviderProps) {
  const { sandbox } = useDebugSession();
  return (
    <DebugStateContext.Provider value={DEBUG_ENABLED ? (transform) => {
      if (!DEBUG_ENABLED) return Promise.reject(new Error("このビルドではデバッグ操作を利用できません。"));
      return updateState((current) => {
        const next = transform(current);
        if (!sandbox && next !== current) throw new Error("データ操作はテストデータへ切り替えてから実行してください。");
        return next;
      });
    } : null}>
      {children}
    </DebugStateContext.Provider>
  );
}

export function useDebugStateUpdate() {
  return useContext(DebugStateContext);
}
