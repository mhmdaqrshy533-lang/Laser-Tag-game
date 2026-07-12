const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

code = code.replace(
  `camera.rotation.set(player.pitch, player.yaw + Math.PI, 0, 'YXZ');`,
  `camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');`
);
code = code.replace(
  `camera.rotation.set(player.pitch, player.yaw + Math.PI, 0, 'YXZ');`,
  `camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');`
);

fs.writeFileSync('src/components/VisualEngine.tsx', code);
