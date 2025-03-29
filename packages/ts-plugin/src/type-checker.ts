import type * as ts from "typescript";
import { BRAND_PROPERTY_NAME } from "./constants";

/**
 * Checks if a type has the brand property and numeric index properties "0" and "1",
 * indicating it's likely the desired branded tuple-like structure.
 * Optionally checks that "2" does *not* exist for stricter 2-element matching.
 */
export function isBrandedAndTupleLike(type: ts.Type): boolean {
  // Check 1: Brand property
  const brandProp = type.getProperty(BRAND_PROPERTY_NAME);
  if (!brandProp) {
    return false;
  }

  // Check 2: Numeric indices "0" and "1"
  const prop0 = type.getProperty("0");
  const prop1 = type.getProperty("1");
  if (!prop0 || !prop1) {
    return false;
  }

  // Optional Check 3: Ensure "2" does not exist
  const prop2 = type.getProperty("2");
  if (prop2) {
    return false; // Treat as not strictly tuple-like if prop "2" exists
  }

  return true;
}
