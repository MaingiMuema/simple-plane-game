import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import Spaceship from './Spaceship';
import Scene from './Scene';

const Game = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 5, 15], fov: 75 }}
        style={{ background: '#000000' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <OrbitControls enableZoom={false} />
        <Stars />
        <Scene />
        <Spaceship />
      </Canvas>
    </div>
  );
};

export default Game;
