import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, KeyboardControls, OrbitControls } from '@react-three/drei';
import Spaceship from './Spaceship';
import Scene from './Scene';

const Game = () => {
  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp"] },
        { name: "backward", keys: ["ArrowDown"] },
        { name: "left", keys: ["ArrowLeft"] },
        { name: "right", keys: ["ArrowRight"] },
        { name: "ascend", keys: ["KeyW", "w"] },
        { name: "descend", keys: ["KeyS", "s"] },
      ]}
    >
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas
          camera={{ 
            position: [0, 20, 50],
            fov: 60,
            near: 0.1,
            far: 1000
          }}
          style={{ background: '#000000' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Stars />
          {/* Add mouse controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={100}
            minDistance={15}
          />
          <Scene />
          <Spaceship />
        </Canvas>
      </div>
    </KeyboardControls>
  );
};

export default Game;
