import type * as ts from "typescript";
import type { PluginOptions } from "./constants";

export function parseConfig(
  tsInstance: typeof ts,
  config: Partial<PluginOptions>,
) {
  return {
    diagnosticCategory:
      config.errorLevel === "warning"
        ? tsInstance.DiagnosticCategory.Warning
        : tsInstance.DiagnosticCategory.Error,
    allowIgnoredError: config.allowIgnoredError ?? true,
    checkWrappedCalls: config.checkWrappedCalls ?? true,
  };
}

export type ParsedConfig = ReturnType<typeof parseConfig>;
