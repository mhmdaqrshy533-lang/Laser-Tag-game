const fs = require('fs');
let code = fs.readFileSync('src/components/PhysicsEngine.ts', 'utf8');

code = code.replace(
  `    // Floor collision
    if (player.position.y < -5) {
      player.position.y = -5;
      player.pitch = Math.min(0, player.pitch);
    }`,
  `    // Floor collision
    if (player.position.y < -95) {
      player.position.y = -95;
      player.pitch = Math.min(0, player.pitch);
    }`
);

fs.writeFileSync('src/components/PhysicsEngine.ts', code);
