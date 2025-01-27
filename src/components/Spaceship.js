/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useKeyboardControls,
  Trail,
  useGLTF,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import * as THREE from "three";
import {
  checkSphereCollision,
  calculateCollisionResponse,
} from "../utils/collisionUtils";

const Spaceship = ({ obstacles = [] }) => {
  const shipRef = useRef();
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const [engineGlow, setEngineGlow] = useState(0.5);
  const exhaustTrailLeftRef = useRef();
  const exhaustTrailRightRef = useRef();
  const [shieldActive, setShieldActive] = useState(false);
  const [lastShieldToggle, setLastShieldToggle] = useState(0);
  const [holoOpacity] = useState(0);
  const [isColliding, setIsColliding] = useState(false);
  const [collisionCooldown, setCollisionCooldown] = useState(0);
  const [earthColliding, setEarthColliding] = useState(false);
  const [gravityEffect, setGravityEffect] = useState(new THREE.Vector3());
  const shipRadius = 2; // Approximate ship collision radius

  // Get keyboard controls
  const [, getKeys] = useKeyboardControls();

  // Get camera and clock
  const { camera, clock } = useThree();

  // Movement parameters
  const normalMaxSpeed = 1.0;
  const acceleration = 0.03;
  const deceleration = 0.01;
  const turnSpeed = 0.03; // Speed of turning
  const ascendSpeed = 0.5;
  const tiltAngle = Math.PI * 0.15;
  const direction = useRef(new THREE.Vector3(0, 0, 1)); // Ship's forward direction

  useFrame(() => {
    if (!shipRef.current) return;

    const velocity = velocityRef.current;
    const ship = shipRef.current;

    // Get the current state of all controls
    const { forward, backward, left, right, ascend, descend, shield } =
      getKeys();

    // Handle shield toggle with debounce
    if (shield && clock.elapsedTime - lastShieldToggle > 0.3) {
      // Add debounce
      setShieldActive((prev) => !prev);
      setLastShieldToggle(clock.elapsedTime);
    }

    // Calculate current max speed based on shield status
    const currentMaxSpeed = shieldActive ? normalMaxSpeed * 10 : normalMaxSpeed;

    // Forward/Backward movement with momentum
    if (forward) {
      velocity.z = Math.max(velocity.z - acceleration, -currentMaxSpeed);
      setEngineGlow(shieldActive ? 2.5 : 1.5);
    } else if (backward) {
      velocity.z = Math.min(velocity.z + acceleration, currentMaxSpeed * 0.5); // Changed to positive
      setEngineGlow(shieldActive ? 2.0 : 1.0);
    } else {
      velocity.z *= 1 - deceleration;
      setEngineGlow(shieldActive ? 1.0 : 0.5);
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
    const hoverOffset = Math.sin(clock.elapsedTime * 2) * 0.02;
    ship.position.y += hoverOffset;

    // Improved camera following
    const speedFactor = Math.abs(velocity.z) / normalMaxSpeed;
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
    const engineIntensity = Math.abs(velocity.z) / normalMaxSpeed;
    setEngineGlow(0.5 + engineIntensity);

    // Add subtle pulsing to the neon lights
    const pulseIntensity = Math.sin(clock.elapsedTime * 2) * 0.3 + 0.7;

    // Update material colors if refs exist
    if (shipRef.current) {
      shipRef.current.traverse((child) => {
        if (child.isMesh && child.material.userData.isNeon) {
          child.material.emissiveIntensity = pulseIntensity;
        }
      });
    }

    // Enhanced collision detection
    let collisionResponse = new THREE.Vector3();
    let isCollidingWithEarth = false;

    obstacles.forEach((obstacle) => {
      const isEarthObstacle = obstacle.type === "earth";
      const collisionDetected = checkSphereCollision(
        [ship.position.x, ship.position.y, ship.position.z],
        obstacle.position,
        shipRadius,
        obstacle.baseRadius * obstacle.scale
      );

      if (collisionDetected) {
        // Calculate base collision response
        const response = calculateCollisionResponse(
          [ship.position.x, ship.position.y, ship.position.z],
          obstacle.position,
          isEarthObstacle ? 3 : 2 // Stronger response for Earth
        );

        if (isEarthObstacle) {
          isCollidingWithEarth = true;

          // Add atmospheric entry effects
          if (!earthColliding) {
            // Initial impact
            velocity.multiplyScalar(0.3); // Stronger velocity reduction
            setEarthColliding(true);
          }

          // Calculate gravity effect
          const gravityDirection = new THREE.Vector3()
            .subVectors(new THREE.Vector3(...obstacle.position), ship.position)
            .normalize();
          setGravityEffect(gravityDirection.multiplyScalar(0.05));

          // Scale response based on shield
          response.multiplyScalar(shieldActive ? 0.4 : 1);
        } else if (collisionCooldown <= 0) {
          // Normal asteroid collision handling
          setIsColliding(true);
          setCollisionCooldown(1);
          velocity.multiplyScalar(shieldActive ? 0.7 : 0.5);
        }

        collisionResponse.add(response);
      }
    });

    // Update Earth collision state
    if (!isCollidingWithEarth && earthColliding) {
      setEarthColliding(false);
      setGravityEffect(new THREE.Vector3());
    }

    // Apply gravity effect
    if (earthColliding) {
      ship.position.add(gravityEffect);
      velocity.add(gravityEffect);
    }

    // Apply collision response
    if (collisionResponse.length() > 0) {
      ship.position.add(collisionResponse);
    }

    // Add Earth collision visual effects
    if (earthColliding) {
      const atmosphereGlow = Math.sin(clock.elapsedTime * 10) * 0.5 + 0.5;
      shipRef.current.traverse((child) => {
        if (child.isMesh && child.material.userData.isNeon) {
          child.material.emissiveIntensity = atmosphereGlow * 5;
        }
      });
    }

    // Update collision cooldown
    if (collisionCooldown > 0) {
      setCollisionCooldown((prev) => Math.max(0, prev - clock.elapsedTime));
    } else {
      setIsColliding(false);
    }

    // Add collision visual effect
    if (isColliding) {
      shipRef.current.traverse((child) => {
        if (child.isMesh && child.material.userData.isNeon) {
          child.material.emissiveIntensity = 3;
        }
      });
    }
  });

  // Updated color scheme with more vibrant colors
  const mainColor = "#00f7ff";
  const accentColor = "#ff00d4";
  const glowColor = "#80ffff";
  const shieldColor = "#4080ff";
  const engineGlowColor = "#ff6600";
  const holoColor = "#00ffff";
  const energyColor = "#ff00ff";
  const trimColor = "#00ff88";
  const panelColor = "#4d00ff";

  return (
    <group ref={shipRef} position={[0, 5, 0]} rotation={[0, Math.PI, 0]}>
      {/* Energy Shield Effect */}
      {shieldActive && (
        <mesh>
          <sphereGeometry args={[2.5, 32, 32]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.5}
            chromaticAberration={1}
            transmission={0.9}
            distortion={0.5}
            color={shieldColor}
            temporalDistortion={0.3}
            distortionScale={0.5}
            opacity={0.2}
          />
        </mesh>
      )}

      {/* Add shield glow effect when active */}
      {shieldActive && (
        <pointLight color={shieldColor} intensity={2} distance={5} decay={2} />
      )}

      {/* Enhanced Main Hull */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 1.2, 4, 16]} />
        <meshStandardMaterial
          color={mainColor}
          metalness={1}
          roughness={0.2}
          envMapIntensity={3}
        />
      </mesh>

      {/* Advanced Geometric Panels */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`panel-${i}`}
          position={[0, 0, -0.5]}
          rotation={[0, (i * Math.PI) / 2, 0]}
        >
          <boxGeometry args={[0.3, 1.5, 0.05]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Holographic HUD Elements */}
      <group position={[0, 0.8, -1.5]}>
        <sprite scale={[1, 1, 1]}>
          <spriteMaterial
            color={holoColor}
            transparent
            opacity={holoOpacity}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>

      {/* Enhanced Engine System */}
      <group position={[0, -0.2, 1.5]}>
        {[-0.8, 0.8].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            {/* Plasma Containment Ring */}
            <mesh>
              <torusGeometry args={[0.4, 0.05, 16, 32]} />
              <meshStandardMaterial
                color={energyColor}
                emissive={energyColor}
                emissiveIntensity={2}
              />
            </mesh>

            {/* Enhanced Engine Trail */}
            <Trail
              ref={i === 0 ? exhaustTrailLeftRef : exhaustTrailRightRef}
              length={20}
              color={new THREE.Color(engineGlowColor)}
              attenuation={(t) => t * t}
              width={1.2}
            >
              <mesh>
                <sphereGeometry args={[0.15]} />
                <meshBasicMaterial
                  color={engineGlowColor}
                  transparent
                  opacity={0.8}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </Trail>
          </group>
        ))}
      </group>

      {/* Energy Field Effects */}
      <group position={[0, 0, 0]}>
        <pointLight color={energyColor} intensity={2} distance={4} decay={2} />
        <mesh>
          <sphereGeometry args={[2, 16, 16]} />
          <meshBasicMaterial
            color={energyColor}
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Enhanced Weapon Systems */}
      {[-1.5, 1.5].map((x, i) => (
        <group key={i} position={[x, -0.1, -0.5]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, 1, 8]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={1}
            />
          </mesh>
          <pointLight
            position={[0, 0, -0.5]}
            color={energyColor}
            intensity={0.5}
            distance={2}
          />
        </group>
      ))}

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

      {/* Add collision effect flash */}
      {isColliding && (
        <pointLight color="#ff0000" intensity={5} distance={10} decay={2} />
      )}

      {/* Add atmospheric entry effect */}
      {earthColliding && (
        <>
          <pointLight color="#ff4400" intensity={3} distance={5} decay={2} />
          <mesh>
            <sphereGeometry args={[2.2, 16, 16]} />
            <meshBasicMaterial
              color="#ff2200"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
    </group>
  );
};

Spaceship.propTypes = {
  obstacles: PropTypes.arrayOf(
    PropTypes.shape({
      position: PropTypes.arrayOf(PropTypes.number).isRequired,
      baseRadius: PropTypes.number.isRequired,
      scale: PropTypes.number.isRequired,
      type: PropTypes.string,
      isEarth: PropTypes.bool,
    })
  ),
};

Spaceship.defaultProps = {
  obstacles: [],
};

export default Spaceship;
