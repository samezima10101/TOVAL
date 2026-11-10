import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const [target, ...args] = process.argv.slice(2);
if (target !== "external" && target !== "internal") throw new Error("Choose external or internal export.");
const cli = path.join(path.dirname(require.resolve("expo/package.json")), "bin", "cli");
const result = spawnSync(process.execPath, [
  cli, "export", "--platform", "ios", "--output-dir", target === "internal" ? "dist/ios-internal" : "dist/ios", ...args,
], {
  stdio: "inherit",
  env: { ...process.env, EXPO_PUBLIC_APP_ENV: target === "internal" ? "internal" : "production" },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
