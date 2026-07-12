sed -i '/if (actions.setPlaneStats) {/i\
    // Plane Shooting\
    player.shootCooldown = (player.shootCooldown || 0) - pDt;\
    if ((keys[" "] || mobileInput.shooting) && player.shootCooldown <= 0) {\
       player.shootCooldown = 0.1;\
       const spawnPos = player.position.clone().add(forwardVec.clone().multiplyScalar(5));\
       const endPos = spawnPos.clone().add(forwardVec.clone().multiplyScalar(500));\
       actions.addLaser([spawnPos.x, spawnPos.y, spawnPos.z], [endPos.x, endPos.y, endPos.z], "#00f3ff");\
       \
       // Check for facility hit\
       for (const id in state.enemies) {\
           const enemy = state.enemies[id];\
           if (enemy.health > 0) {\
               const dist = endPos.distanceTo(enemy.position);\
               // Crude ray-sphere intersection or distance to line could be better, \
               // but let just do distance to line from enemy to laser start-end\
               const line = new THREE.Line3(spawnPos, endPos);\
               const closestPoint = new THREE.Vector3();\
               line.closestPointToPoint(enemy.position, true, closestPoint);\
               if (closestPoint.distanceTo(enemy.position) < 50) {\
                   actions.hitEnemy(id, true);\
                   actions.addParticles([closestPoint.x, closestPoint.y, closestPoint.z], "#ef4444");\
               }\
           }\
       }\
    }\
' src/components/PhysicsEngine.ts
