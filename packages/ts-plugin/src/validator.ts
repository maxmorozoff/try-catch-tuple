import type * as ts from "typescript";
import type { ParsedConfig } from "./config";
import {
  ERROR_CODE,
  ERROR_MESSAGE,
  type Logger,
  PLUGIN_NAME,
  TRY_CATCH_FUNCTION_NAME,
} from "./constants";
import { isBrandedAndTupleLike } from "./type-checker";

// Interface for the minimal info needed to create a diagnostic
export interface ValidationErrorInfo {
  start: number;
  length: number;
  messageText: string;
  code: number;
}

export type NodeValidatorFn = (
  node: ts.Node,
  sourceFile: ts.SourceFile,
) => void;

/**
 * Factory function to create a configured node validator.
 * Captures context-specific dependencies in a closure.
 */
export function createValidator(
  tsInstance: typeof ts,
  typeChecker: ts.TypeChecker,
  addDiagnostic: (diagnostic: ts.Diagnostic) => void,
  pluginOptions: ParsedConfig,
  sourceName: string,
  logger?: Logger,
): NodeValidatorFn {
  const diagnosticCategory = pluginOptions.diagnosticCategory;

  return function validateNode(node: ts.Node, sourceFile: ts.SourceFile): void {
    if (!tsInstance.isVariableDeclaration(node)) {
      return; // Only validate VariableDeclarations for now
    }

    if (!node.initializer) return;

    let isPotentialTryCatchCall = false;
    const initExpr = node.initializer;
    let callExpr: ts.CallExpression | undefined;

    if (tsInstance.isCallExpression(initExpr)) {
      callExpr = initExpr;
    } else if (
      tsInstance.isAwaitExpression(initExpr) &&
      tsInstance.isCallExpression(initExpr.expression)
    ) {
      callExpr = initExpr.expression;
    }

    if (callExpr && tsInstance.isIdentifier(callExpr.expression)) {
      const functionName = callExpr.expression.text;

      if (functionName === TRY_CATCH_FUNCTION_NAME) {
        isPotentialTryCatchCall = true;
      } else if (pluginOptions.checkWrappedCalls) {
        // TODO: use tryCatch utility instead
        try {
          const resolvedType = typeChecker.getTypeAtLocation(initExpr);
          if (isBrandedAndTupleLike(resolvedType)) {
            // logger?.info(
            //   `[${PLUGIN_NAME}] Initializer ending with '${functionName}' matches target type.`,
            // );
            isPotentialTryCatchCall = true;
          }
        } catch (e) {
          logger?.warn?.(
            `[${PLUGIN_NAME}] Warning: Type checking failed for ${functionName}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    }
    // else if (callExpr && tsInstance.isPropertyAccessExpression...) { /* Future enhancement */ }

    if (!isPotentialTryCatchCall) {
      return; // Not a call we are tracking
    }

    let isValidUsage = false;
    if (tsInstance.isArrayBindingPattern(node.name)) {
      const elements = node.name.elements;
      if (elements.length === 2) {
        const secondElement = elements[1];
        if (tsInstance.isBindingElement(secondElement)) {
          isValidUsage = true;
        } else if (tsInstance.isOmittedExpression(secondElement)) {
          isValidUsage = pluginOptions.allowIgnoredError;
        }
      }
    }
    if (!isValidUsage) {
      const targetNode = node.name;
      addDiagnostic({
        file: sourceFile,
        start: targetNode.getStart(sourceFile),
        length: targetNode.getWidth(sourceFile),
        messageText: ERROR_MESSAGE,
        category: diagnosticCategory,
        code: ERROR_CODE,
        source: sourceName,
      });
    }
  };
}
