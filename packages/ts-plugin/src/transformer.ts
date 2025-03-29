import type { PluginConfig, TransformerExtras } from "ts-patch";
import { LogLevel, createLogger } from "ts-patch/system";
import type * as ts from "typescript";
import { parseConfig } from "./config";
import { type Logger, type PluginOptions, TRANSFORMER_NAME } from "./constants";
import { createVisitor } from "./visitor";

type TransformerConfig = PluginConfig & PluginOptions;

const transformer = (
  program: ts.Program,
  pluginConfig: TransformerConfig,
  { ts: tsInstance, addDiagnostic }: TransformerExtras,
) => {
  const typeChecker = program.getTypeChecker();

  const config = pluginConfig ?? {};

  const pluginOptions = parseConfig(tsInstance, config);

  const baseLogger = createLogger(LogLevel.normal, true);
  const logger: Logger = {
    info: (msg) => baseLogger(["!", msg]),
    warn: (msg) => baseLogger(["~", msg]),
  };

  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      const visit = createVisitor(
        tsInstance,
        typeChecker,
        sourceFile,
        addDiagnostic,
        pluginOptions,
        TRANSFORMER_NAME,
        logger,
        context,
      );
      return tsInstance.visitNode(sourceFile, visit, tsInstance.isSourceFile);
    };
  };
};

export default transformer;
