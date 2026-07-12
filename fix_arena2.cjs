const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

const targetStr = `      {/* 2. Runway Asphalt center strip */}`;
const repStr = `      {/* Massive Grass Ground */}
      <mesh receiveShadow position={[0, -5.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20000, 20000]} />
        <meshStandardMaterial color="#166534" roughness={1.0} metalness={0.0} />
      </mesh>
      
      {/* 2. Runway Asphalt center strip */}`;

code = code.replace(targetStr, repStr);
fs.writeFileSync('src/components/VisualEngine.tsx', code);
