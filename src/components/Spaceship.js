import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

const Spaceship = () => {
  const shipRef = useRef();
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const [engineGlow, setEngineGlow] = useState(0.5);

  // Get keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls();

  // Get camera
  const { camera } = useThree();

  // Movement parameters
  const maxSpeed = 1.0;
  const acceleration = 0.03;
  const deceleration = 0.01;
  const turnSpeed = 0.03; // Speed of turning
  const ascendSpeed = 0.5;
  const tiltAngle = Math.PI * 0.15;
  const direction = useRef(new THREE.Vector3(0, 0, -1)); // Ship's forward direction

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
      setEngineGlow(1.5);
    } else if (backward) {
      velocity.z = Math.min(velocity.z + acceleration, maxSpeed * 0.5);
      setEngineGlow(1.0);
    } else {
      velocity.z *= (1 - deceleration);
      setEngineGlow(0.5);
    }

    // Update ship's direction and rotation
    let targetRotationZ = 0;

    if (left) {
      ship.rotation.y += turnSpeed;
      targetRotationZ = tiltAngle;
    } else if (right) {
      ship.rotation.y -= turnSpeed;
      targetRotationZ = -tiltAngle;
    }

    // Update direction vector based on ship's rotation
    direction.current.set(0, 0, -1).applyQuaternion(ship.quaternion);

    // Move ship in its current direction
    ship.position.x += direction.current.x * velocity.z;
    ship.position.z += direction.current.z * velocity.z;

    // Smooth banking effect
    ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, targetRotationZ, 0.1);

    // Vertical movement with momentum
    if (ascend) {
      velocity.y = Math.min(velocity.y + acceleration, ascendSpeed);
    } else if (descend) {
      velocity.y = Math.max(velocity.y - acceleration, -ascendSpeed);
    } else {
      velocity.y *= (1 - deceleration);
    }

    // Apply vertical velocity
    ship.position.y += velocity.y;

    // Add gentle hover effect
    const hoverOffset = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    ship.position.y += hoverOffset;

    // Camera following with improved distance based on speed
    const speedFactor = Math.abs(velocity.z) / maxSpeed;
    const baseCameraDistance = 12;
    const extraDistance = speedFactor * 8;
    
    const cameraOffset = new THREE.Vector3(
      0,
      5 + speedFactor * 2,
      baseCameraDistance + extraDistance
    );

    // Rotate camera offset based on ship's rotation
    cameraOffset.applyQuaternion(ship.quaternion);
    const targetCameraPos = ship.position.clone().add(cameraOffset);
    
    camera.position.lerp(targetCameraPos, 0.1);
    camera.lookAt(ship.position);

    // Update engine visual effects
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
