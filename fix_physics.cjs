const fs = require('fs');
let code = fs.readFileSync('src/components/PhysicsEngine.ts', 'utf8');

const targetStr = `    // Floor collision
    if (player.position.y < -5) {
      player.position.y = -5;
      player.pitch = Math.min(0, player.pitch);
    }`;

const repStr = `    // Floor collision
    if (player.position.y < -100) {
      player.position.y = -100;
      player.pitch = Math.min(0, player.pitch);
    }`;

code = code.replace(targetStr, repStr);

const targetStr2 = `    // Floor Collision
    if (player.position.y < -3.9) {
      player.position.y = -3.9;
      player.velocityY = 0;
      player.isMoving = keys.w || keys.a || keys.s || keys.d;
    }`;

// Wait, the regular Floor Collision is -3.9! So let's check what the file has.
