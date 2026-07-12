sed -i '1231,1260c\
      <group ref={meshRef}>\
        {enemy.health > 0 ? (\
          <group>\
            <mesh castShadow receiveShadow position={[0, 20, 0]}>\
              <boxGeometry args={[40, 40, 40]} />\
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />\
            </mesh>\
            <mesh position={[0, 45, 0]}>\
              <sphereGeometry args={[10, 16, 16]} />\
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />\
            </mesh>\
            {/* Simple Health bar */}\
            <mesh position={[0, 60, 0]}>\
               <planeGeometry args={[(enemy.health / 1000) * 30, 2]} />\
               <meshBasicMaterial color="red" />\
            </mesh>\
          </group>\
        ) : (\
          <mesh position={[0, 10, 0]}>\
            <boxGeometry args={[40, 20, 40]} />\
            <meshStandardMaterial color="#333" metalness={0.9} roughness={0.9} />\
          </mesh>\
        )}\
      </group>\
    );\
  }\
  if (enemy?.type === '"'"'boss'"'"') {\
    return <BossVisual stateRef={stateRef} bossId={botId} />;\
  }\
  return (\
    <group ref={meshRef}>' src/components/VisualEngine.tsx
