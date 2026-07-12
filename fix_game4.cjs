const fs = require('fs');
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

code = code.replace(
  `    const keys = { ...store.keys };
    if (store.joystickMove) {
      keys.w = store.joystickMove.y > 0.5;
      keys.s = store.joystickMove.y < -0.5;
      keys.a = store.joystickMove.x < -0.5;
      keys.d = store.joystickMove.x > 0.5;
    }`,
  `    const winKeys = (window as any).keys || {};
    const mobileInput = store.mobileInput || { move: {x: 0, y: 0}, look: {x: 0, y: 0}, shooting: false };
    const keys = { 
      w: winKeys.w || false, 
      a: winKeys.a || false, 
      s: winKeys.s || false, 
      d: winKeys.d || false, 
      ' ': winKeys[' '] || false, 
      shift: winKeys.shift || false 
    };`
);

code = code.replace(
  `    simulateFixedStep(
      physState, 
      delta, 
      keys, 
      camera, 
      store.playerLevel,
      store.gameState,
      store.playerState,
      {`,
  `    simulateFixedStep(
      physState, 
      keys,
      mobileInput,
      delta, 
      store.playerLevel,
      store.gameState,
      store.playerState,
      {`
);

code = code.replace(`        winGame: () => store.setGameState('won'),`, `        winGame: () => store.setScreen('campaign'),`);

fs.writeFileSync('src/components/Game.tsx', code);
