import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Stars, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const Scene = () => {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const [obstacles, setObstacles] = useState([]);
  const spaceRadius = 100; // Radius of active space around player

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
    radius: 1000,
    depth: 300,
    count: 15000,
    factor: 4,
    saturation: 0,
    fade: true,
    speed: 0.5
  }), []);

  // Initialize obstacles
  useMemo(() => {
    const newObstacles = Array.from({ length: 50 }).map(() => ({
      position: [
        Math.random() * spaceRadius * 2 - spaceRadius,
        Math.random() * spaceRadius * 2 - spaceRadius,
        Math.random() * spaceRadius * 2 - spaceRadius
      ],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ],
      color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
      scale: Math.random() * 3 + 1
    }));
    setObstacles(newObstacles);
  }, []);

  useFrame(({ clock, camera }) => {
    const elapsedTime = clock.getElapsedTime();
    
    // Rotate Earth
    if (earthRef.current) {
      earthRef.current.rotation.y = elapsedTime * 0.05;
    }

    // Rotate clouds slightly faster
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = elapsedTime * 0.06;
    }

    // Reposition obstacles that are too far from the camera
    setObstacles(prevObstacles => {
      return prevObstacles.map(obs => {
        const distance = new THREE.Vector3(...obs.position).distanceTo(camera.position);
        if (distance > spaceRadius) {
          // Generate new position relative to camera
          const angle = Math.random() * Math.PI * 2;
          const radius = spaceRadius * 0.7;
          const heightOffset = Math.random() * spaceRadius - spaceRadius/2;
          return {
            ...obs,
            position: [
              camera.position.x + Math.cos(angle) * radius,
              camera.position.y + heightOffset,
              camera.position.z + Math.sin(angle) * radius
            ],
            rotation: [
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            ]
          };
        }
        return obs;
      });
    });
  });

  return (
    <>
      {/* Environment and Lighting */}
      <Environment preset="night" />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#2ef" />
      
      {/* Stars background */}
      <Stars {...starProps} />
      
      {/* Space fog */}
      <fog attach="fog" args={['#000', 100, 400]} />
      
      {/* Earth as an obstacle */}
      <group position={[30, 20, -40]} scale={0.3}>
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
          scale={obs.scale}
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
            distance={10}
          />
        </mesh>
      ))}
    </>
  );
};

export default Scene;
