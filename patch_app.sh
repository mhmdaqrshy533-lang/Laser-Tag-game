sed -i 's/import { StealthHUD } from '"'"'.\/components\/StealthHUD'"'"';/import { SpaceHUD } from '"'"'.\/components\/SpaceHUD'"'"';/' src/App.tsx
sed -i 's/return <StealthHUD \/>;/return <SpaceHUD \/>;/' src/App.tsx
