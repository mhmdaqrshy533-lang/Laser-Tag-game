const fs = require('fs');
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

code = code.replace(
  `       physState.player.isShooting = true;
       setTimeout(() => { physState.player.isShooting = false; }, 100);`,
  `       const winKeys = (window as any).keys || {};
       winKeys[' '] = true;
       setTimeout(() => { winKeys[' '] = false; }, 100);`
);

fs.writeFileSync('src/components/Game.tsx', code);
