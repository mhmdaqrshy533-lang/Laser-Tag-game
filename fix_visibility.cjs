const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

const targetStr = `      if (bodyGroupRef.current) bodyGroupRef.current.visible = !player.inVehicle;
      if (planeGroupRef.current) planeGroupRef.current.visible = player.inVehicle;`;

// Wait, is there already visibility toggle? Let's check first.
