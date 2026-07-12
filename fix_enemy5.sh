sed -i '1262,1296c\
  return (\
    <group ref={meshRef}>\
      {/* Active Group */}\
      <group ref={activeGroupRef}>\
        <VisualSoldierMesh \
           getPhysicsState={() => {\
            const enemy = stateRef.current.enemies[botId];\
            return {\
              stance: '"'"'stand'"'"',\
              isMoving: enemy ? enemy.isMoving : false,\
              isAiming: enemy ? enemy.isAiming : false\
            };\
          }}\
          color="#f97316" \
           isEnemy={true}\
        />\
      </group>\
      {/* Stunned Group */}\
      <group ref={stunnedGroupRef} visible={false}>\
        <mesh position={[0, 1.2, 0]}>\
          <sphereGeometry args={[1.6, 16, 16]} />\
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.25} wireframe />\
        </mesh>\
        <group rotation={[Math.PI / 2, 0, 0]}>\
          <VisualSoldierMesh \
             getPhysicsState={() => ({ stance: '"'"'prone'"'"', isMoving: false, isAiming: false })}\
             color="#3b82f6" \
             isEnemy={true}\
          />\
        </group>\
      </group>\
    </group>\
  );' src/components/VisualEngine.tsx
