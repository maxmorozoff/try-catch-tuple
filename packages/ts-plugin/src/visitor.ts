import type * as ts from "typescript";
import type { ParsedConfig } from "./config";
import type { Logger } from "./constants";

import { createValidator } from "./validator";

/**
 * Creates a visitor function that traverses the AST and applies validation.
 */
export function createVisitor(
  tsInstance: typeof ts,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  addDiagnostic: (diagnostic: ts.Diagnostic) => void,
  pluginOptions: ParsedConfig,
  sourceName: string,
  logger?: Logger,
  context?: ts.TransformationContext,
) {
  const nodeValidator = createValidator(
    tsInstance,
    typeChecker,
    addDiagnostic,
    pluginOptions,
    sourceName,
    logger,
  );

  function visit(node: ts.Node): ts.Node {
    if (tsInstance.isVariableDeclaration(node)) {
      if (node.parent && tsInstance.isVariableDeclarationList(node.parent)) {
        const declarationListParent = node.parent.parent;
        if (
          declarationListParent &&
          (tsInstance.isVariableStatement(declarationListParent) ||
            tsInstance.isForStatement(declarationListParent) ||
            tsInstance.isForOfStatement(declarationListParent) ||
            tsInstance.isForInStatement(declarationListParent))
        ) {
          nodeValidator(node, sourceFile);
        }
      }
    }
    return tsInstance.visitEachChild(node, visit, context);
  }

  return visit;
}
