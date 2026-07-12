const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

const targetRegex = /return \(\s*<>\s*\{isTimeDilationActive[\s\S]*?(?=export function ShieldGeneratorVisual)/;

const replacement = `return (
    <>
      {isTimeDilationActive && (
        <group>
          <mesh scale={[100, 100, 100]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial 
              color="#3b82f6" 
              side={THREE.BackSide} 
              transparent 
              opacity={0.05} 
            />
          </mesh>
        </group>
      )}
    </>
  );
}
`;

code = code.replace(targetRegex, replacement);
fs.writeFileSync('src/components/VisualEngine.tsx', code);
