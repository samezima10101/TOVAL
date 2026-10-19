import { createContext, useContext, type RefObject } from "react";

export type ShopTabExitHandler = (leave: () => void) => void;

export const ShopTabExitContext = createContext<RefObject<ShopTabExitHandler | null> | null>(null);

export default function useShopTabExit() {
  const handler = useContext(ShopTabExitContext);
  if (!handler) throw new Error("Shop tab exit requires the tabs layout.");
  return handler;
}
