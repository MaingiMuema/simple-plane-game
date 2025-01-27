import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Stars, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const Scene = () => {
  const earthRef = useRef();
  const cloudsRef = useRef();

  // Load Earth textures
  const [
    colorMap,
    normalMap,
    specularMap,
    cloudsMap
  ] = useTexture([
    '/textures/earth_daymap.jpg',
    '/textures/earth_normal_map.jpg',
    '/textures/earth_specular_map.jpg',
  ]);

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

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    
    // Rotate Earth
    if (earthRef.current) {
      earthRef.current.rotation.y = elapsedTime * 0.05;
    }

    // Rotate clouds slightly faster
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = elapsedTime * 0.06;
    }
  });

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
      
      {/* Earth */}
      <group>
        {/* Main Earth sphere */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[10, 64, 64]} />
          <meshPhongMaterial
            map={colorMap}
            normalMap={normalMap}
            specularMap={specularMap}
            shininess={5}
            specular={new THREE.Color(0x333333)}
          />
        </mesh>

        {/* Cloud layer */}
        <mesh ref={cloudsRef} scale={1.01}>
          <sphereGeometry args={[10, 64, 64]} />
          <meshPhongMaterial
            map={cloudsMap}
            transparent={true}
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>

        {/* Atmosphere glow */}
        <mesh scale={1.1}>
          <sphereGeometry args={[10, 64, 64]} />
          <meshPhongMaterial
            color="#004fff"
            transparent={true}
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

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
