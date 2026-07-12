const fs = require('fs');
let code = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

const target = `  return (
    <group ref={meshRef}>
      {/* Active Group */}
           getPhysicsState={() => {
      <group ref={activeGroupRef}>
        <VisualSoldierMesh
            const enemy = stateRef.current.enemies[botId];`;

const replacement = `  return (
    <group ref={meshRef}>
      {/* Active Group */}
      <group ref={activeGroupRef}>
        <VisualSoldierMesh
            getPhysicsState={() => {
            const enemy = stateRef.current.enemies[botId];`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/VisualEngine.tsx', code);
