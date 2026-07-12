const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');
const sf = ts.createSourceFile('VisualEngine.tsx', code, ts.ScriptTarget.Latest, true);
let diagnostics = sf.parseDiagnostics;
if (diagnostics && diagnostics.length > 0) {
  console.log('Syntax Errors:');
  diagnostics.forEach(d => {
    const pos = sf.getLineAndCharacterOfPosition(d.start);
    console.log(`Line ${pos.line + 1}: ${d.messageText}`);
  });
} else {
  console.log('No Syntax Errors!');
}
