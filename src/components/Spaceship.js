import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

const Spaceship = () => {
  const shipRef = useRef();
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const [engineGlow, setEngineGlow] = useState(0.5);

  // Get keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls();

  // Movement parameters
  const maxSpeed = 0.5;
  const acceleration = 0.02;
  const deceleration = 0.01;
  const rotationSpeed = 0.03;
  const ascendSpeed = 0.15;
  const tiltAngle = Math.PI * 0.15; // Maximum tilt angle when turning

  useFrame((state, delta) => {
    if (!shipRef.current) return;

    const velocity = velocityRef.current;
    const ship = shipRef.current;

    // Get the current state of all controls
    const {
      forward,
      backward,
      left,
      right,
      ascend,
      descend
    } = getKeys();

    // Forward/Backward movement with momentum
    if (forward) {
      velocity.z = Math.max(velocity.z - acceleration, -maxSpeed);
      setEngineGlow(1.5); // Increase engine glow when accelerating
    } else if (backward) {
      velocity.z = Math.min(velocity.z + acceleration, maxSpeed * 0.5); // Slower reverse speed
      setEngineGlow(1.0);
    } else {
      // Gradual deceleration
      velocity.z *= (1 - deceleration);
      setEngineGlow(0.5);
    }

    // Apply velocity to position
    ship.position.z += velocity.z;

    // Left/Right movement with banking effect
    let targetRotationY = 0;
    let targetRotationZ = 0;

    if (left) {
      ship.position.x -= rotationSpeed;
      targetRotationY = rotationSpeed * 10;
      targetRotationZ = tiltAngle;
    } else if (right) {
      ship.position.x += rotationSpeed;
      targetRotationY = -rotationSpeed * 10;
      targetRotationZ = -tiltAngle;
    }

    // Smooth rotation interpolation
    ship.rotation.y = THREE.MathUtils.lerp(ship.rotation.y, targetRotationY, 0.1);
    ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, targetRotationZ, 0.1);

    // Vertical movement (W/S keys)
    if (ascend) {
      ship.position.y += ascendSpeed * delta;
    }
    if (descend) {
      ship.position.y -= ascendSpeed * delta;
    }

    // Add gentle hover effect
    const hoverOffset = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    ship.position.y += hoverOffset;

    // Keep ship within bounds
    const bounds = {
      x: 30,
      y: 20,
      z: 30
    };

    ship.position.x = THREE.MathUtils.clamp(ship.position.x, -bounds.x, bounds.x);
    ship.position.y = THREE.MathUtils.clamp(ship.position.y, 0, bounds.y);
    ship.position.z = THREE.MathUtils.clamp(ship.position.z, -bounds.z, bounds.z);

    // Update engine visual effects based on movement
    const engineIntensity = Math.abs(velocity.z) / maxSpeed;
    setEngineGlow(0.5 + engineIntensity);
  });

  const mainColor = "#e0e0e0";
  const accentColor = "#2a2a2a";
  const glowColor = "#00aaff";

  return (
    <group ref={shipRef} position={[0, 5, 0]} rotation={[0, Math.PI, 0]}>
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
        {/* Dynamic engine glow */}
        <pointLight 
          position={[-0.8, 0, 0.5]} 
          color="#ff4400" 
          intensity={engineGlow} 
          distance={3} 
        />
        <pointLight 
          position={[0.8, 0, 0.5]} 
          color="#ff4400" 
          intensity={engineGlow} 
          distance={3} 
        />
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
