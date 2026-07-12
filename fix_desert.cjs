const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

const targetStr = `      <Sky sunPosition={[500, 50, -1000]} turbidity={0.6} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <ambientLight intensity={0.2} color="#fca5a5" />`;

const repStr = `      <color attach="background" args={['#d97706']} />
      <Sky sunPosition={[500, 50, -1000]} turbidity={0.6} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <ambientLight intensity={0.2} color="#fca5a5" />`;

code = code.replace(targetStr, repStr);
fs.writeFileSync('src/components/VisualEngine.tsx', code);
