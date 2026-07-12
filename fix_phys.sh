sed -i '127c\
  if (state.selectedStage === '"'"'desert'"'"' && player.inVehicle) {' src/components/PhysicsEngine.ts
