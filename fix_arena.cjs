const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

const targetStr = `  return (
    <group>
      {/* 1. Procedural Sky & Ambient sun light - Highly dramatic sunset */}
      <Sky sunPosition={[150, 15, -100]} turbidity={10} rayleigh={6} mieCoefficient={0.005} mieDirectionalG={0.8} />

      {/* 2. Runway Asphalt center strip */}`;

const repStr = `  return (
    <group>
      {/* 1. Procedural Sky & Ambient sun light - Highly dramatic sunset */}
      <Sky sunPosition={[150, 15, -100]} turbidity={10} rayleigh={6} mieCoefficient={0.005} mieDirectionalG={0.8} />
      
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 200, 3000]} />
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[100, 100, 50]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* 2. Runway Asphalt center strip */}`;

code = code.replace(targetStr, repStr);
fs.writeFileSync('src/components/VisualEngine.tsx', code);
