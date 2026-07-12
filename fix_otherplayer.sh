sed -i '1318,1325c\
  return (\
    <group ref={meshRef}>\
      <VisualSoldierMesh \
         getPhysicsState={() => ({ stance: '"'"'stand'"'"', isMoving: false, isAiming: false })}\
         color={data.color || '"'"'#ec4899'"'"'} \
       />\
    </group>\
  );' src/components/VisualEngine.tsx
