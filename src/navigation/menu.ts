import { router } from "expo-router";

export function closeMenu() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}
