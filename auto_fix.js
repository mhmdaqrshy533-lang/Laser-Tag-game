const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

// Fix Array.from().map(...)
code = code.replace(/\)      (\s*)\{?\/\*/g, ')}($1{/*');
code = code.replace(/\)      (\s*)<group/g, ')}($1<group');

fs.writeFileSync('src/components/VisualEngine.tsx', code);
