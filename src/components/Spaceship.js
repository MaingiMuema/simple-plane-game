import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls, Trail, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const Spaceship = () => {
  const shipRef = useRef();
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const [engineGlow, setEngineGlow] = useState(0.5);
  const exhaustTrailLeftRef = useRef();
  const exhaustTrailRightRef = useRef();

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
  const direction = useRef(new THREE.Vector3(0, 0, 1)); // Ship's forward direction

  useFrame((state, delta) => {
    if (!shipRef.current) return;

    const velocity = velocityRef.current;
    const ship = shipRef.current;

    // Get the current state of all controls
    const { forward, backward, left, right, ascend, descend } = getKeys();

    // Forward/Backward movement with momentum
    if (forward) {
      velocity.z = Math.max(velocity.z - acceleration, -maxSpeed); // Changed to negative
      setEngineGlow(1.5);
    } else if (backward) {
      velocity.z = Math.min(velocity.z + acceleration, maxSpeed * 0.5); // Changed to positive
      setEngineGlow(1.0);
    } else {
      velocity.z *= 1 - deceleration;
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
    direction.current.set(0, 0, 1).applyQuaternion(ship.quaternion);

    // Move ship in its current direction
    ship.position.x += direction.current.x * velocity.z;
    ship.position.z += direction.current.z * velocity.z;

    // Smooth banking effect
    ship.rotation.z = THREE.MathUtils.lerp(
      ship.rotation.z,
      targetRotationZ,
      0.1
    );

    // Vertical movement with momentum
    if (ascend) {
      velocity.y = Math.min(velocity.y + acceleration, ascendSpeed);
    } else if (descend) {
      velocity.y = Math.max(velocity.y - acceleration, -ascendSpeed);
    } else {
      velocity.y *= 1 - deceleration;
    }

    // Apply vertical velocity
    ship.position.y += velocity.y;

    // Add gentle hover effect
    const hoverOffset = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    ship.position.y += hoverOffset;

    // Improved camera following
    const speedFactor = Math.abs(velocity.z) / maxSpeed;
    const baseCameraDistance = 15;
    const extraDistance = speedFactor * 10;

    // Calculate ideal camera position
    const idealOffset = new THREE.Vector3(
      0,
      6 + speedFactor * 3,
      baseCameraDistance + extraDistance
    ).applyQuaternion(ship.quaternion);

    const targetCameraPos = ship.position.clone().add(idealOffset);

    // Force immediate camera update if too far from ship
    const distanceToShip = camera.position.distanceTo(ship.position);
    const maxAllowedDistance = baseCameraDistance + extraDistance + 20;

    if (distanceToShip > maxAllowedDistance) {
      // Teleport camera closer if it's too far
      camera.position.copy(targetCameraPos);
    } else {
      // Smooth camera movement
      camera.position.lerp(targetCameraPos, 0.1);
    }

    // Ensure camera always looks at ship
    camera.lookAt(ship.position);

    // Update engine visual effects
    const engineIntensity = Math.abs(velocity.z) / maxSpeed;
    setEngineGlow(0.5 + engineIntensity);

    // Add subtle pulsing to the neon lights
    const pulseIntensity = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;

    // Update material colors if refs exist
    if (shipRef.current) {
      shipRef.current.traverse((child) => {
        if (child.isMesh && child.material.userData.isNeon) {
          child.material.emissiveIntensity = pulseIntensity;
        }
      });
    }
  });

  // Updated color scheme with more vibrant colors
  const mainColor = "#0dcdeb"; // Deep metallic blue base
  const accentColor = "#ff00ff"; // Bright magenta accent
  const glowColor = "#00ffff"; // Cyan glow
  const panelColor = "#4d00ff"; // Bright purple panels
  const engineGlowColor = "#ff4400"; // Bright orange engine glow
  const trimColor = "#00ff88"; // Neon green trim

  return (
    <group ref={shipRef} position={[0, 5, 0]} rotation={[0, Math.PI, 0]}>
      {/* Main fuselage with enhanced metallic finish */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 1.2, 4, 12]} />
        <meshStandardMaterial
          color={mainColor}
          metalness={1}
          roughness={0.2}
          envMapIntensity={3}
        />
      </mesh>

      {/* Enhanced neon trim rings with stronger glow */}
      <mesh position={[0, 0, -1]}>
        <torusGeometry args={[0.9, 0.02, 16, 32]} />
        <meshStandardMaterial
          color={trimColor}
          emissive={trimColor}
          emissiveIntensity={2}
          metalness={0.9}
          roughness={0.2}
          userData={{ isNeon: true }}
        />
      </mesh>

      {/* Improved nose cone with panels */}
      <mesh position={[0, 0, -2]}>
        <coneGeometry args={[0.8, 2, 12]} />
        <meshStandardMaterial
          color={mainColor}
          metalness={0.9}
          roughness={0.3}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Panel details on nose */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[0, 0, -1.5]}
          rotation={[0, (i * Math.PI) / 2, 0]}
        >
          <planeGeometry args={[0.4, 1]} />
          <meshStandardMaterial
            color={panelColor}
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Enhanced wings with beveled edges */}
      <group position={[0, 0, 0]}>
        {/* Left wing */}
        <mesh position={[-2, 0, 0]} rotation={[0, 0, Math.PI * 0.1]}>
          <boxGeometry args={[3, 0.15, 2]} />
          <meshStandardMaterial
            color={mainColor}
            metalness={0.9}
            roughness={0.3}
            envMapIntensity={1.5}
          />
        </mesh>
        {/* Wing panel details */}
        <mesh position={[-2, 0.08, 0]} rotation={[0, 0, Math.PI * 0.1]}>
          <planeGeometry args={[2.5, 1.5]} />
          <meshStandardMaterial
            color={panelColor}
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>
        {/* Mirror for right wing */}
        <mesh position={[2, 0, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
          <boxGeometry args={[3, 0.15, 2]} />
          <meshStandardMaterial
            color={mainColor}
            metalness={0.9}
            roughness={0.3}
            envMapIntensity={1.5}
          />
        </mesh>
        <mesh position={[2, 0.08, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
          <planeGeometry args={[2.5, 1.5]} />
          <meshStandardMaterial
            color={panelColor}
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>
      </group>

      {/* Enhanced cockpit glow */}
      <group position={[0, 0.5, -1]}>
        <pointLight color={glowColor} intensity={0.8} distance={3} />
        <mesh>
          <sphereGeometry
            args={[0.4, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]}
          />
          <meshPhysicalMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={0.5}
            transmission={0.9}
            thickness={0.5}
            opacity={0.7}
            transparent={true}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Enhanced engines with cooling vents */}
      <group position={[0, -0.2, 1.5]}>
        {/* Engine bases */}
        {[-0.8, 0.8].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.4, 1, 12]} />
              <meshStandardMaterial
                color={mainColor}
                emissive={engineGlowColor}
                emissiveIntensity={0.5}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Cooling vents */}
            {[0, 1, 2].map((j) => (
              <mesh
                key={j}
                position={[0, 0, -0.2 + j * 0.2]}
                rotation={[0, 0, (Math.PI / 6) * j]}
              >
                <boxGeometry args={[0.5, 0.05, 0.05]} />
                <meshStandardMaterial
                  color="#600"
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
            ))}
            {/* Enhanced engine glow */}
            <pointLight
              position={[0, 0, 0.5]}
              color={engineGlowColor}
              intensity={engineGlow * 2}
              distance={5}
            />

            {/* Volumetric engine glow */}
            <sprite position={[0, 0, 0.7]} scale={[1, 1, 1]}>
              <spriteMaterial
                map={null}
                color={engineGlowColor}
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
              />
            </sprite>

            <Trail
              ref={i === 0 ? exhaustTrailLeftRef : exhaustTrailRightRef}
              length={10}
              color={new THREE.Color(engineGlowColor)}
              attenuation={(t) => t * t}
              width={0.8}
            >
              <mesh>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial
                  color={engineGlowColor}
                  transparent
                  opacity={0.6}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </Trail>
          </group>
        ))}
      </group>

      {/* Enhanced weapon mounts with details */}
      <group position={[0, 0, 0]}>
        {[-1.5, 1.5].map((x, i) => (
          <group key={i} position={[x, -0.1, -0.5]}>
            <mesh>
              <boxGeometry args={[0.2, 0.2, 0.8]} />
              <meshStandardMaterial
                color={accentColor}
                metalness={0.95}
                roughness={0.1}
              />
            </mesh>
            {/* Weapon detail rings */}
            <mesh position={[0, 0, -0.3]}>
              <torusGeometry args={[0.15, 0.03, 8, 8]} />
              <meshStandardMaterial
                color={panelColor}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Enhanced ship ambient lighting */}
      <pointLight
        position={[0, 0, -2]}
        color={glowColor}
        intensity={1.2}
        distance={5}
      />
      <pointLight
        position={[0, 0.5, -1]}
        color={glowColor}
        intensity={0.8}
        distance={4}
      />

      {/* Enhanced navigation lights */}
      <pointLight
        position={[-2, 0, 0]}
        color="#ff0000"
        intensity={1}
        distance={3}
      />
      <pointLight
        position={[2, 0, 0]}
        color="#00ff00"
        intensity={1}
        distance={3}
      />

      {/* Additional rim lighting for contrast */}
      <pointLight
        position={[0, 2, 0]}
        color="#ffffff"
        intensity={0.5}
        distance={4}
      />
      <pointLight
        position={[0, -2, 0]}
        color="#ffffff"
        intensity={0.5}
        distance={4}
      />

      {/* Wing trim lights */}
      {[-2, 2].map((x, i) => (
        <pointLight
          key={i}
          position={[x, 0, 0]}
          color={trimColor}
          intensity={0.3}
          distance={2}
        />
      ))}
    </group>
  );
};

export default Spaceship;
