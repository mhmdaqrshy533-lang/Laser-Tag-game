const fs = require('fs');
let code = fs.readFileSync('src/components/Game.tsx', 'utf8');

const targetStr = `  return (
    <div className="w-full h-full relative" id="game-canvas-container">
      <WebGLBoundary onReset={handleCanvasReset}>
        <AnyCanvas 
          key={canvasKey}
          shadows={!isMobile} 
          camera={{ fov: 75, near: 0.1, far: 8000 }}
          dpr={isMobile ? [1, 1.25] : [1, 2]}
          gl={{ 
            antialias: true, 
            alpha: false, 
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          }}
        >
          {/* Context Loss Guardian */}
                    
          
          {/* Centered logic processors */}
          <GameLoop 
            stateRef={stateRef} 
            triggerReloadRef={triggerReloadRef} 
            shootRef={shootRef} 
          {/* Optimized environment meshes */}
          {selectedStage === 'desert' ? (
          ) : (
          )}

          <Lasers />
          <ImpactParticles />

          {/* High speed visual mesh hooks */}
          {enemies?.map(enemy => (
          ))}

          {shieldGenerators?.map(gen => (
          ))}

          {otherPlayerIds?.map(id => (
          ))}
          
          {/* Highly optimized tactical Bloom shader */}
          {!isMobile && (
            <EffectComposer>
            </EffectComposer>
          )}
        </AnyCanvas>
      </WebGLBoundary>
    </div>
  );
}`;

const repStr = `  return (
    <div className="w-full h-full relative" id="game-canvas-container">
      <CinematicOverlay />
      <WebGLBoundary onReset={handleCanvasReset}>
        <AnyCanvas 
          key={canvasKey}
          shadows={!isMobile} 
          camera={{ fov: 75, near: 0.1, far: 8000 }}
          dpr={isMobile ? [1, 1.25] : [1, 2]}
          gl={{ 
            antialias: true, 
            alpha: false, 
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          }}
        >
          {/* Context Loss Guardian */}
          <WebGLContextListener onContextLost={handleCanvasReset} />
                    
          {/* Centered logic processors */}
          <GameLoop 
            stateRef={stateRef} 
            triggerReloadRef={triggerReloadRef} 
            shootRef={shootRef} 
          />
          
          {/* Optimized environment meshes */}
          {selectedStage === 'desert' ? (
            <DesertVisual />
          ) : (
            <ArenaVisual />
          )}

          <Lasers />
          <ImpactParticles />
          <ChronosEffect />

          {/* High speed visual mesh hooks */}
          <PlayerVisual stateRef={stateRef} />
          {enemies?.map(enemy => (
            <EnemyVisual key={enemy.id} stateRef={stateRef} botId={enemy.id} />
          ))}

          {shieldGenerators?.map(gen => (
            <ShieldGeneratorVisual key={gen.id} id={gen.id} />
          ))}

          {otherPlayerIds?.map(id => (
            <OtherPlayerVisual key={id} id={id} />
          ))}
          
          {/* Highly optimized tactical Bloom shader */}
          {!isMobile && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} />
            </EffectComposer>
          )}
        </AnyCanvas>
      </WebGLBoundary>
    </div>
  );
}`;

const startIndex = code.indexOf('return (');
if (startIndex !== -1) {
    code = code.substring(0, startIndex) + repStr;
    fs.writeFileSync('src/components/Game.tsx', code);
    console.log("Successfully replaced");
} else {
    console.log("Could not find start");
}
