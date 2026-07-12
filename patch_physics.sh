sed -i 's/if (keys.w) player.pitch -= 1.5 \* pDt;/if (keys.w || mobileInput.move.y < -0.1) player.pitch -= 1.5 * pDt;/' src/components/PhysicsEngine.ts
sed -i 's/if (keys.s) player.pitch += 1.5 \* pDt;/if (keys.s || mobileInput.move.y > 0.1) player.pitch += 1.5 * pDt;/' src/components/PhysicsEngine.ts
sed -i 's/if (keys.a) player.yaw += 1.5 \* pDt;/if (keys.a || mobileInput.move.x < -0.1) player.yaw += 1.5 * pDt;/' src/components/PhysicsEngine.ts
sed -i 's/if (keys.d) player.yaw -= 1.5 \* pDt;/if (keys.d || mobileInput.move.x > 0.1) player.yaw -= 1.5 * pDt;/' src/components/PhysicsEngine.ts
