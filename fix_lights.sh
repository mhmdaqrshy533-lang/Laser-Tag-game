sed -i '/<color attach="background"/d' src/components/Game.tsx
sed -i '/<fog attach="fog"/d' src/components/Game.tsx
sed -i '/<ambientLight intensity={isMobile ? 1.0 : 0.8} \/>/d' src/components/Game.tsx
sed -i '/<directionalLight/d' src/components/Game.tsx
sed -i '/position={\[100, 100, 50\]}/d' src/components/Game.tsx
sed -i '/intensity={1.5}/d' src/components/Game.tsx
sed -i '/castShadow={!isMobile}/d' src/components/Game.tsx
sed -i '/shadow-mapSize={\[1024, 1024\]}/d' src/components/Game.tsx
sed -i '/\/>/d' src/components/Game.tsx
