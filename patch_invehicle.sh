sed -i '/isFPP: boolean;/a\  inVehicle?: boolean;' src/components/PhysicsEngine.ts

sed -i 's/isFPP: isDesert ? true : false,/isFPP: isDesert ? true : false,\n      inVehicle: isDesert ? true : false,/' src/components/PhysicsEngine.ts

sed -i "s/if (state.selectedStage === 'desert') {/if (state.selectedStage === 'desert' && player.inVehicle) {/" src/components/PhysicsEngine.ts
