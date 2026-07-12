sed -i '1154,1194c\
  return (\
    <group>\
      {/* Soldier visual body - Hidden in FPP Mode for gameplay realism */}\
      <group ref={meshRef}>\
        <group ref={bodyGroupRef}>\
             <group ref={planeGroupRef}>\
               {/* Stealth Plane Flying Wing design */}\
               <mesh castShadow rotation={[0, Math.PI, 0]}>\
                  {/* Flattened triangle/wing shape */}\
                  <coneGeometry args={[12, 18, 3, 1, false, 0, Math.PI]} />\
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />\
                  <Text position={[-3, 0.5, -4]} rotation={[-Math.PI / 2, 0, Math.PI]} fontSize={1.5} color="#cbd5e1" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">\
                    TANKEEL\
                  </Text>\
                  <Text position={[3, 0.5, -4]} rotation={[-Math.PI / 2, 0, Math.PI]} fontSize={1.5} color="#cbd5e1">\
                    تَنكِيل\
                  </Text>\
               </mesh>\
               {/* Cockpit canopy */}\
               <mesh position={[0, 1.5, 2]} rotation={[0, Math.PI, 0]}>\
                 <boxGeometry args={[3, 1, 6]} />\
                 <meshStandardMaterial color="#000000" metalness={1.0} roughness={0.0} />\
               </mesh>\
             </group>\
             <group ref={soldierGroupRef}>\
               <VisualSoldierMesh \
                 getPhysicsState={() => {\
                  const p = stateRef.current.player;\
                  return {\
                    stance: p.stance,\
                    isMoving: p.isMoving,\
                    isAiming: p.isAiming\
                  };\
                }}\
                color="#10b981" \
               />\
             </group>\
        </group>\
      </group>' src/components/VisualEngine.tsx
