const ts = require("typescript");

module.exports = function tsxLoader(source) {
  const callback = this.async();
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      isolatedModules: true,
      skipLibCheck: true,
    },
    fileName: this.resourcePath,
    reportDiagnostics: true,
  });

  const diagnostics = result.diagnostics || [];
  const error = diagnostics.find((item) => item.category === ts.DiagnosticCategory.Error);

  if (error) {
    const message = ts.flattenDiagnosticMessageText(error.messageText, "\n");
    callback(new Error(message));
    return;
  }

  callback(null, result.outputText, result.sourceMapText);
};
