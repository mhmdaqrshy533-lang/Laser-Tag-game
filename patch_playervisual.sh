sed -i '/const bodyGroupRef = useRef<THREE.Group>(null);/a\  const planeGroupRef = useRef<THREE.Group>(null);\  const soldierGroupRef = useRef<THREE.Group>(null);' src/components/VisualEngine.tsx

sed -i '/const player = stateRef.current.player;/a\    if (planeGroupRef.current) planeGroupRef.current.visible = !!player.inVehicle;\    if (soldierGroupRef.current) soldierGroupRef.current.visible = !player.inVehicle;' src/components/VisualEngine.tsx
