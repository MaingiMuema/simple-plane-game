import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

const Spaceship = () => {
  const shipRef = useRef();
  const speed = 0.1;
  const rotationSpeed = 0.05;

  useFrame((state, delta) => {
    if (!shipRef.current) return;

    const keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    };

    Object.keys(keys).forEach(key => {
      keys[key] = state.controls?.[key.toLowerCase()] ?? false;
    });

    if (keys.ArrowUp) shipRef.current.position.z -= speed;
    if (keys.ArrowDown) shipRef.current.position.z += speed;
    if (keys.ArrowLeft) shipRef.current.rotation.y += rotationSpeed;
    if (keys.ArrowRight) shipRef.current.rotation.y -= rotationSpeed;

    // Add subtle hover effect
    shipRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
  });

  const mainColor = "#e0e0e0";  // Light gray base color
  const accentColor = "#2a2a2a"; // Dark gray accent color
  const glowColor = "#00aaff";   // Blue glow color

  return (
    <group ref={shipRef} position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
      {/* Main fuselage */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 1.2, 4, 8]} />
        <meshStandardMaterial 
          color={mainColor}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Front nose cone */}
      <mesh position={[0, 0, -2]}>
        <coneGeometry args={[0.8, 2, 8]} />
        <meshStandardMaterial 
          color={mainColor}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Main wings */}
      <group position={[0, 0, 0]}>
        {/* Left wing */}
        <mesh position={[-2, 0, 0]} rotation={[0, 0, Math.PI * 0.1]}>
          <boxGeometry args={[3, 0.1, 2]} />
          <meshStandardMaterial 
            color={mainColor}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Right wing */}
        <mesh position={[2, 0, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
          <boxGeometry args={[3, 0.1, 2]} />
          <meshStandardMaterial 
            color={mainColor}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Wing tips */}
      <group>
        {/* Left wing tip */}
        <mesh position={[-3.5, 0.3, 0]} rotation={[0, 0, Math.PI * 0.15]}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial 
            color={accentColor}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Right wing tip */}
        <mesh position={[3.5, 0.3, 0]} rotation={[0, 0, -Math.PI * 0.15]}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial 
            color={accentColor}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Cockpit */}
      <group position={[0, 0.5, -1]}>
        <mesh>
          <sphereGeometry args={[0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial 
            color={glowColor}
            metalness={0.1}
            roughness={0.1}
            opacity={0.7}
            transparent={true}
          />
        </mesh>
      </group>

      {/* Engines */}
      <group position={[0, -0.2, 1.5]}>
        {/* Left engine */}
        <mesh position={[-0.8, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
          <meshStandardMaterial 
            color={accentColor}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Right engine */}
        <mesh position={[0.8, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
          <meshStandardMaterial 
            color={accentColor}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Engine glow */}
        <pointLight position={[-0.8, 0, 0.5]} color="#ff4400" intensity={1} distance={2} />
        <pointLight position={[0.8, 0, 0.5]} color="#ff4400" intensity={1} distance={2} />
      </group>

      {/* Additional details */}
      {/* Weapon mounts */}
      <group position={[0, 0, 0]}>
        {/* Left weapon mount */}
        <mesh position={[-1.5, -0.1, -0.5]}>
          <boxGeometry args={[0.2, 0.2, 0.8]} />
          <meshStandardMaterial 
            color={accentColor}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Right weapon mount */}
        <mesh position={[1.5, -0.1, -0.5]}>
          <boxGeometry args={[0.2, 0.2, 0.8]} />
          <meshStandardMaterial 
            color={accentColor}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Ship lights */}
      <pointLight position={[0, 0, -2]} color={glowColor} intensity={0.5} distance={3} />
      <pointLight position={[0, 0.5, -1]} color={glowColor} intensity={0.3} distance={2} />
    </group>
  );
};

export default Spaceship;
