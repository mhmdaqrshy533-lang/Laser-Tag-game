const fs = require('fs');
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');
code = code.replace(`        winGame: () => store.setScreen('campaign'),`, `        winGame: store.winGame,`);
fs.writeFileSync('src/components/Game.tsx', code);
