/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
import React, { useRef, useState, useEffect, Suspense } from "react";
import PropTypes from "prop-types";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import {
  useKeyboardControls,
  Trail,
  useGLTF,
  MeshTransmissionMaterial,
  Billboard,
} from "@react-three/drei";
import * as THREE from "three";
import {
  checkSphereCollision,
  calculateCollisionResponse,
} from "../utils/collisionUtils";

const Projectile = ({ position, direction }) => {
  Projectile.propTypes = {
    position: PropTypes.instanceOf(THREE.Vector3).isRequired,
    direction: PropTypes.instanceOf(THREE.Vector3).isRequired,
  };
  const ref = useRef();
  const speed = 2.0;

  useFrame(() => {
    if (ref.current) {
      ref.current.position.add(direction.clone().multiplyScalar(speed));
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.1]} />
      <meshStandardMaterial
        color="#ff0000"
        emissive="#ff0000"
        emissiveIntensity={2}
      />
    </mesh>
  );
};

const Explosion = ({ position, scale }) => {
  Explosion.propTypes = {
    position: PropTypes.instanceOf(THREE.Vector3).isRequired,
    scale: PropTypes.number.isRequired,
  };
  const ref = useRef();
  const [opacity, setOpacity] = useState(1);

  useFrame(() => {
    if (ref.current) {
      setOpacity((prev) => Math.max(0, prev - 0.02));
      ref.current.scale.multiplyScalar(1.05);
    }
  });

  return (
    <Billboard>
      <mesh ref={ref} position={position} scale={[scale, scale, scale]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#ff6600"
          transparent
          opacity={opacity}
          emissive="#ff6600"
          emissiveIntensity={2}
        />
      </mesh>
    </Billboard>
  );
};

const Spaceship = ({
  obstacles = [],
  onAsteroidDestroyed,
  onObstaclesUpdate,
}) => {
  const shipRef = useRef();
  const [projectiles, setProjectiles] = useState([]);
  const [explosions, setExplosions] = useState([]);
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

  // Load the GLB model
  const { scene } = useGLTF("/models/spaceship.glb");

  // Load textures
  const [colorMap, normalMap, roughnessMap, metalnessMap, emissiveMap, aoMap] =
    useLoader(THREE.TextureLoader, [
      "/models/24-textures/Intergalactic Spaceship_color_4.jpg",
      "/models/24-textures/Intergalactic Spaceship_nmap_2_Tris.jpg",
      "/models/24-textures/Intergalactic Spaceship_rough.jpg",
      "/models/24-textures/Intergalactic Spaceship_metalness.jpg",
      "/models/24-textures/Intergalactic Spaceship_emi.jpg",
      "/models/24-textures/Intergalactic Spaceship Ao_Blender.jpg",
    ]);

  // Initialize model and materials
  useEffect(() => {
    if (scene && shipRef.current) {
      // Clone the scene
      const clonedScene = scene.clone(true);

      // Apply materials to the model
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: colorMap,
            normalMap: normalMap,
            roughnessMap: roughnessMap,
            metalnessMap: metalnessMap,
            emissiveMap: emissiveMap,
            aoMap: aoMap,
            emissive: new THREE.Color(0x00f7ff),
            emissiveIntensity: 1,
            metalness: 0.8,
            roughness: 0.2,
          });
          child.material.needsUpdate = true;

          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Set scale
      clonedScene.scale.set(0.5, 0.5, 0.5);

      // Rotate model to face forward (180 degrees around Y-axis)
      clonedScene.rotation.set(0, Math.PI, 0);

      // Add the model to the ship group
      shipRef.current.add(clonedScene);
    }
  }, [
    scene,
    colorMap,
    normalMap,
    roughnessMap,
    metalnessMap,
    emissiveMap,
    aoMap,
  ]);

  // Get keyboard controls
  const [, getKeys] = useKeyboardControls();

  // Get camera and clock
  const { camera, clock } = useThree();

  // Movement parameters
  const normalMaxSpeed = 1.0;
  const acceleration = 0.03;
  const deceleration = 0.01;
  const turnSpeed = 0.03;
  const ascendSpeed = 0.5;
  const tiltAngle = Math.PI * 0.15;
  const direction = useRef(new THREE.Vector3(0, 0, 1));

  useFrame(() => {
    if (!shipRef.current) return;

    const velocity = velocityRef.current;
    const ship = shipRef.current;

    // Get the current state of all controls
    const { forward, backward, left, right, ascend, descend, shield, shoot } =
      getKeys();

    // Handle shooting
    if (shoot && clock.elapsedTime - lastShieldToggle > 0.2) {
      const direction = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(ship.quaternion)
        .normalize();
      setProjectiles((prev) => [
        ...prev,
        {
          id: Date.now(),
          position: ship.position.clone(),
          direction: direction,
        },
      ]);
      setLastShieldToggle(clock.elapsedTime);
    }

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
      velocity.z = Math.min(velocity.z + acceleration, currentMaxSpeed * 0.5);
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

    // Handle projectile collisions
    setProjectiles((prev) =>
      prev.filter((projectile) => {
        const projectilePos = projectile.position;
        let shouldRemove = false;

        obstacles.forEach((obstacle) => {
          const distance = new THREE.Vector3(...obstacle.position).distanceTo(
            projectilePos
          );
          if (distance < obstacle.baseRadius * obstacle.scale) {
            // Create explosion
            setExplosions((prev) => [
              ...prev,
              {
                id: Date.now(),
                position: projectilePos,
                scale: 0.5,
              },
            ]);
            shouldRemove = true;

            // Remove asteroid after multiple hits
            const updatedObstacles = obstacles.filter((o) => o !== obstacle);
            onObstaclesUpdate?.(updatedObstacles);
            onAsteroidDestroyed?.();
          }
        });

        return !shouldRemove;
      })
    );

    // Remove old explosions
    setExplosions((prev) => prev.filter((e) => e.scale < 5));

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
          isEarthObstacle ? 3 : 2
        );

        if (isEarthObstacle) {
          isCollidingWithEarth = true;

          // Add atmospheric entry effects
          if (!earthColliding) {
            // Initial impact
            velocity.multiplyScalar(0.3);
            setEarthColliding(true);
          }
        } else if (collisionCooldown <= 0 && !shieldActive) {
          // Destroy asteroid on collision when shield is active
          const updatedObstacles = obstacles.filter((o) => o !== obstacle);
          onObstaclesUpdate?.(updatedObstacles);
          onAsteroidDestroyed?.();

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
    <group ref={shipRef} position={[0, 5, 0]} rotation={[0, 0, 0]}>
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

      {/* Enhanced Engine System */}
      <group position={[0, -0.2, 1.5]}>
        {[-0.8, 0.8].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            {/* Enhanced engine glow */}
            <pointLight
              position={[0, 0, 0.5]}
              color={engineGlowColor}
              intensity={engineGlow * 2}
              distance={5}
            />

            {/* Engine Trail */}
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
      {projectiles.map((p) => (
        <Projectile key={p.id} position={p.position} direction={p.direction} />
      ))}
      {explosions.map((e) => (
        <Explosion key={e.id} position={e.position} scale={e.scale} />
      ))}

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

      {/* Navigation lights */}
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
  onAsteroidDestroyed: PropTypes.func,
  onObstaclesUpdate: PropTypes.func,
};

Spaceship.defaultProps = {
  obstacles: [],
};

export default Spaceship;
