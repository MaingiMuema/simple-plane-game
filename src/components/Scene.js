import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';

const Scene = () => {
  // Create stars for the background
  const starProps = useMemo(() => ({
    radius: 100,
    depth: 50,
    count: 5000,
    factor: 4,
    saturation: 0,
    fade: true,
    speed: 2
  }), []);

  // Create random obstacles with custom colors
  const obstacles = useMemo(() => 
    Array.from({ length: 15 }).map(() => ({
      position: [
        Math.random() * 60 - 30,
        Math.random() * 15,
        Math.random() * 60 - 30
      ],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ],
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
    })), []
  );

  return (
    <>
      {/* Environment and Lighting */}
      <Environment preset="night" />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#2ef" />
      
      {/* Stars background */}
      <Stars {...starProps} />
      
      {/* Space fog */}
      <fog attach="fog" args={['#000', 30, 100]} />
      
      {/* Ground plane with gradient */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#111"
          metalness={0.8}
          roughness={0.5}
          emissive="#001"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Obstacles */}
      {obstacles.map((obs, i) => (
        <mesh
          key={i}
          position={obs.position}
          rotation={obs.rotation}
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color={obs.color}
            emissive={obs.color}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.8}
          />
          <pointLight
            color={obs.color}
            intensity={0.5}
            distance={5}
          />
        </mesh>
      ))}
    </>
  );
};

export default Scene;
