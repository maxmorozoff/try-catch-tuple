import type * as ts from "typescript/lib/tsserverlibrary";
import { parseConfig } from "./config";
import { type Logger, PLUGIN_NAME, type PluginOptions } from "./constants";
import { createVisitor } from "./visitor";

function init(mod: { typescript: typeof ts }) {
  const { typescript: tsInstance } = mod;

  function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    const proxy = { ...info.languageService };
    const logger: Logger = info.project.projectService.logger;

    logger.info(`[${PLUGIN_NAME}] Plugin loaded.`);

    const config = info.config as PluginOptions;
    const pluginOptions = parseConfig(tsInstance, config);

    logger.info(
      `[${PLUGIN_NAME}] Config: severity=${pluginOptions.diagnosticCategory === tsInstance.DiagnosticCategory.Error ? "error" : "warning"}, allowIgnoredError=${pluginOptions.allowIgnoredError}, checkWrappedCalls=${pluginOptions.checkWrappedCalls}`,
    );
    const program = info.languageService.getProgram();

    logger.info(
      `[${PLUGIN_NAME}] Current program: ${program ? "exists" : "does not exist"}`,
    );
    if (!program) return proxy;

    proxy.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
      const originalDiagnostics =
        info.languageService.getSemanticDiagnostics(fileName);
      const customDiagnostics: ts.Diagnostic[] = [];

      const program = info.languageService.getProgram();
      const typeChecker = program?.getTypeChecker();

      let sourceFile: ts.SourceFile | undefined;
      if (program) {
        // Normalize the path provided to the function
        const normalizedFileName = tsInstance.server.toNormalizedPath(fileName);

        // Attempt 1: Get from the program (might still work sometimes)
        sourceFile = program.getSourceFile(normalizedFileName);

        logger.info(
          `[${PLUGIN_NAME}] Attempt 1: program.getSourceFile("${normalizedFileName}") -> ${sourceFile ? "Found" : "Not Found"}`,
        );

        // Attempt 2 (More Reliable): Get from the project if not found in program
        // The project often has the most up-to-date view of files the server knows about.
        if (!sourceFile && info.project) {
          // @ts-expect-error FIXME
          sourceFile = info.project.getSourceFile(normalizedFileName);
          logger.info(
            `[${PLUGIN_NAME}] Attempt 2: info.project.getSourceFile("${normalizedFileName}") -> ${sourceFile ? "Found" : "Not Found"}`,
          );
        }
        // Alternative using ScriptInfo (less common for this purpose but possible)
        // if (!sourceFile && info.project) {
        //    const scriptInfo = info.project.getScriptInfo(normalizedFileName);
        //    sourceFile = scriptInfo?.getSnapshot() ? program?.getSourceFile(normalizedFileName) : undefined; // Re-check program after getting script info? Might be complex.
        //    logger.info(`[${PLUGIN_NAME}] Attempt 3: info.project.getScriptInfo("${normalizedFileName}") -> ${scriptInfo ? 'Found ScriptInfo' : 'Not Found ScriptInfo'}`);
        // }
      }

      logger.info(
        `[${PLUGIN_NAME}] Visiting ${fileName} [${sourceFile ? "exists" : "does not exist"}]`,
      );
      logger.info(
        `[${PLUGIN_NAME}] Current program: ${program ? "exists" : "does not exist"}`,
      );
      logger.info(
        `[${PLUGIN_NAME}] Current type checker: ${typeChecker ? "exists" : "does not exist"}`,
      );

      const addDiagnostic = (diagnostic: ts.Diagnostic) =>
        customDiagnostics.push(diagnostic);

      if (sourceFile && typeChecker) {
        const visit = createVisitor(
          tsInstance,
          typeChecker,
          sourceFile,
          addDiagnostic,
          pluginOptions,
          PLUGIN_NAME,
          logger,
          // context,
        );

        // sourceFile.forEachChild(visit);
        visit(sourceFile);

        logger.info(
          `[${PLUGIN_NAME}] Completed visit for ${fileName}. Found ${customDiagnostics.length} custom diagnostics.`,
        );
      } else if (!sourceFile) {
        logger.info(
          `[${PLUGIN_NAME}] Skipping visit for ${fileName}: SourceFile object not found.`,
        );
      } else {
        logger.info(
          `[${PLUGIN_NAME}] Skipping visit for ${fileName}: TypeChecker not available.`,
        );
      }

      return [...originalDiagnostics, ...customDiagnostics];
    };

    function findNodeAtPosition(
      sourceFile: ts.SourceFile,
      start: number,
      end: number,
    ): ts.Node | undefined {
      function find(node: ts.Node): ts.Node | undefined {
        if (
          node &&
          start >= node.getStart(sourceFile) &&
          end <= node.getEnd()
        ) {
          let betterNode: ts.Node | undefined = node;
          tsInstance.forEachChild(node, (n) => {
            const childNode = find(n);
            if (childNode) betterNode = childNode;
          });
          return betterNode;
        }
        return undefined;
      }
      return find(sourceFile);
    }

    proxy.getCodeFixesAtPosition = (
      fileName,
      start,
      end,
      errorCodes,
      formatOptions,
      userPreferences,
    ): readonly ts.CodeFixAction[] => {
      const originalFixes =
        info.languageService.getCodeFixesAtPosition(
          fileName,
          start,
          end,
          errorCodes,
          formatOptions,
          userPreferences,
        ) || [];
      const customFixes: ts.CodeFixAction[] = [];
      const sourceFile = info.languageService
        .getProgram()
        ?.getSourceFile(fileName);
      if (!sourceFile) return originalFixes;
      const node = findNodeAtPosition(sourceFile, start, end);
      let varDeclNode: ts.VariableDeclaration | undefined;
      let current = node;
      while (current) {
        if (tsInstance.isVariableDeclaration(current)) {
          varDeclNode = current;
          break;
        }
        if (current === sourceFile) break;
        current = current.parent;
      }

      if (varDeclNode) {
        let isInvalidUsageForFix = false;
        if (tsInstance.isArrayBindingPattern(varDeclNode.name)) {
          const elements = varDeclNode.name.elements;
          if (
            elements.length !== 2 ||
            (elements.length === 2 &&
              tsInstance.isOmittedExpression(elements[1]) &&
              !pluginOptions.allowIgnoredError)
          ) {
            isInvalidUsageForFix = true;
          }
        } else {
          isInvalidUsageForFix = true;
        }

        if (
          isInvalidUsageForFix &&
          start >= varDeclNode.name.getStart(sourceFile) &&
          end <= varDeclNode.name.getEnd()
        ) {
          const variableNameNode = varDeclNode.name;
          const fixSpan = {
            start: variableNameNode.getStart(sourceFile),
            length: variableNameNode.getWidth(sourceFile),
          };
          const firstElementTextError = tsInstance.isIdentifier(
            variableNameNode,
          )
            ? variableNameNode.getText(sourceFile)
            : tsInstance.isArrayBindingPattern(variableNameNode) &&
                variableNameNode.elements.length > 0
              ? variableNameNode.elements[0].getText(sourceFile)
              : "result";
          const newTextError = `[${firstElementTextError}, error]`;
          customFixes.push({
            description: `Destructure return as [${firstElementTextError}, error]`,
            changes: [
              {
                fileName,
                textChanges: [{ span: fixSpan, newText: newTextError }],
              },
            ],
            fixName: "destructureTryCatchError",
          });
          if (pluginOptions.allowIgnoredError) {
            const firstElementTextOmitted = tsInstance.isIdentifier(
              variableNameNode,
            )
              ? variableNameNode.getText(sourceFile)
              : tsInstance.isArrayBindingPattern(variableNameNode) &&
                  variableNameNode.elements.length > 0
                ? variableNameNode.elements[0].getText(sourceFile)
                : "result";
            const newTextOmitted = `[${firstElementTextOmitted}, ,]`;
            const isAlreadyOmitted =
              tsInstance.isArrayBindingPattern(variableNameNode) &&
              variableNameNode.elements.length === 2 &&
              tsInstance.isOmittedExpression(variableNameNode.elements[1]);
            if (!isAlreadyOmitted) {
              customFixes.push({
                description: `Destructure return as [${firstElementTextOmitted}, ,] (ignore error)`,
                changes: [
                  {
                    fileName,
                    textChanges: [{ span: fixSpan, newText: newTextOmitted }],
                  },
                ],
                fixName: "destructureTryCatchOmitted",
              });
            }
          }
        }
      }
      return [...originalFixes, ...customFixes];
    };

    return proxy;
  }

  return { create };
}

export { init };
// export = init;
