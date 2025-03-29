// Define shared constants and configuration options

// --- Names ---
export const PLUGIN_NAME = "try-catch-tuple-ts-plugin";
export const TRANSFORMER_NAME = "try-catch-tuple-transformer";

// --- Error Details ---
export const ERROR_CODE = 54600;
export const ERROR_MESSAGE =
  "tryCatch return value should be destructured as [result, error].";

// --- Type Checking ---
export const BRAND_PROPERTY_NAME = "__tryCatchTupleResult";
export const TRY_CATCH_FUNCTION_NAME = "tryCatch";

// --- Configuration ---
export type PluginOptions = {
  /**
   * Determines if the diagnostic is reported as an error or a warning.
   * @default 'error'
   */
  errorLevel?: "error" | "warning";
  /**
   * Allow destructuring as `[result, ,]` to ignore the error.
   * @default false // Changed default to false based on code fix logic
   */
  allowIgnoredError?: boolean;
  /**
   * Check wrapped function calls using the type checker. Can impact performance.
   * @default true
   */
  checkWrappedCalls?: boolean;
};

// --- Internal Logger Type (for validator) ---
export interface Logger {
  info(message: string): void;
  warn?(message: string): void;
}
