sed -i '/{useGameStore.getState().selectedStage === '"'"'desert'"'"' ? (/d' src/components/VisualEngine.tsx

sed -i 's/<group>/<group ref={planeGroupRef} visible={false}>/' src/components/VisualEngine.tsx

sed -i 's/) : (//' src/components/VisualEngine.tsx
sed -i 's/<VisualSoldierMesh/<group ref={soldierGroupRef} visible={false}>\n<VisualSoldierMesh/' src/components/VisualEngine.tsx
sed -i 's/color="#10b981" \/>/color="#10b981" \/>\n<\/group>/' src/components/VisualEngine.tsx
sed -i 's/)}//' src/components/VisualEngine.tsx
