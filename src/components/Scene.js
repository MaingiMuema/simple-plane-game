/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Stars,
  Environment,
  useTexture,
  Detailed,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import PropTypes from "prop-types";

const Scene = ({ onObstaclesUpdate }) => {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const [obstacles, setObstacles] = useState([]);
  const spaceRadius = 100; // Radius of active space around player

  // Load Earth textures
  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    "/textures/earth_daymap.jpg",
    "/textures/earth_normal_map.jpg",
    "/textures/earth_specular_map.jpg",
  ]);

  // Load asteroid textures with error handling
  const asteroidTexture = useTexture(
    "/textures/asteroids/asteroid_diffuse.jpg",
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
    }
  );

  // Create stars for the background
  const starProps = useMemo(
    () => ({
      radius: 1000,
      depth: 300,
      count: 15000,
      factor: 4,
      saturation: 0,
      fade: true,
      speed: 0.5,
    }),
    []
  );

  // Create deformed geometry for asteroids
  const createAsteroidGeometry = (radius, detail, seed = 0) => {
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const pos = geometry.attributes.position;
    const vec = new THREE.Vector3();

    // Pseudo-random function based on seed
    const random = (x, y, z) => {
      const dot = x * 12.9898 + y * 78.233 + z * 37.719 + seed;
      const sin = Math.sin(dot) * 143758.5453123;
      return sin - Math.floor(sin);
    };

    // Apply deformation
    for (let i = 0; i < pos.count; i++) {
      vec.fromBufferAttribute(pos, i);
      const distance = vec.length();

      // Generate multiple layers of noise using our seeded random function
      const x = vec.x * 2,
        y = vec.y * 2,
        z = vec.z * 2;
      let noise1 = (random(x, y, z) - 0.5) * 0.15;
      let noise2 = (random(x * 2, y * 2, z * 2) - 0.5) * 0.1;
      let noise3 = (random(x * 4, y * 4, z * 4) - 0.5) * 0.05;

      const totalNoise = noise1 + noise2 + noise3;
      vec.normalize().multiplyScalar(distance * (1 + totalNoise));

      pos.setXYZ(i, vec.x, vec.y, vec.z);
    }

    geometry.computeVertexNormals();
    return geometry;
  };

  // Pre-generate asteroid geometries with more variations
  const asteroidGeometries = useMemo(() => {
    const geometries = {
      large: Array(8)
        .fill(0)
        .map((_, i) => createAsteroidGeometry(2, 3, i)),
      medium: Array(8)
        .fill(0)
        .map((_, i) => createAsteroidGeometry(1.5, 2, i + 8)),
      small: Array(8)
        .fill(0)
        .map((_, i) => createAsteroidGeometry(1, 2, i + 16)),
    };
    return geometries;
  }, []);

  // Initialize obstacles with different asteroid types
  useMemo(() => {
    const asteroidTypes = [
      {
        name: "large",
        baseRadius: 2,
        detail: 3,
        material: "rocky",
      },
      {
        name: "medium",
        baseRadius: 1.5,
        detail: 2,
        material: "metallic",
      },
      {
        name: "small",
        baseRadius: 1,
        detail: 2,
        material: "icy",
      },
    ];

    const newObstacles = Array.from({ length: 50 }).map(() => {
      const type =
        asteroidTypes[Math.floor(Math.random() * asteroidTypes.length)];
      const baseColor = new THREE.Color().setHSL(
        Math.random() * 0.1 + 0.05, // Reddish-brown hue
        Math.random() * 0.3 + 0.5, // Medium-high saturation
        Math.random() * 0.2 + 0.2 // Low-medium lightness
      );

      const scale = Math.random() * 0.5 + 0.5; // More controlled scale variation

      return {
        position: [
          Math.random() * spaceRadius * 2 - spaceRadius,
          Math.random() * spaceRadius * 2 - spaceRadius,
          Math.random() * spaceRadius * 2 - spaceRadius,
        ],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ],
        type: type.name,
        baseRadius: type.baseRadius,
        detail: type.detail,
        material: type.material,
        color: baseColor,
        scale: scale,
        rotationSpeed: (Math.random() - 0.5) * 0.01, // Slower rotation
        uniqueDeformation: Math.random(), // Used for unique geometry generation
      };
    });
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
    setObstacles((prevObstacles) => {
      const updatedObstacles = prevObstacles.map((obs) => {
        const distance = new THREE.Vector3(...obs.position).distanceTo(
          camera.position
        );
        if (distance > spaceRadius) {
          const angle = Math.random() * Math.PI * 2;
          const radius = spaceRadius * 0.7;
          const heightOffset = Math.random() * spaceRadius - spaceRadius / 2;
          return {
            ...obs,
            position: [
              camera.position.x + Math.cos(angle) * radius,
              camera.position.y + heightOffset,
              camera.position.z + Math.sin(angle) * radius,
            ],
          };
        }
        return {
          ...obs,
          rotation: [
            obs.rotation[0] + obs.rotationSpeed,
            obs.rotation[1] + obs.rotationSpeed,
            obs.rotation[2] + obs.rotationSpeed,
          ],
        };
      });
      onObstaclesUpdate(updatedObstacles);
      return updatedObstacles;
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
      <fog attach="fog" args={["#000", 100, 400]} />

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
      {obstacles.map((obs, i) => {
        const AsteroidMaterial = () => {
          switch (obs.material) {
            case "rocky":
              return (
                <meshStandardMaterial
                  map={asteroidTexture}
                  color={obs.color}
                  roughness={0.9}
                  metalness={0.1}
                  bumpScale={0.5}
                />
              );
            case "metallic":
              return (
                <meshStandardMaterial
                  map={asteroidTexture}
                  color={obs.color}
                  metalness={0.8}
                  roughness={0.3}
                  envMapIntensity={1}
                />
              );
            case "icy":
              return (
                <meshPhysicalMaterial
                  map={asteroidTexture}
                  color={obs.color}
                  transmission={0.3}
                  thickness={1}
                  roughness={0.2}
                  ior={1.5}
                  envMapIntensity={1.5}
                />
              );
          }
        };

        // Get pre-generated geometry based on asteroid type
        const geometryIndex = Math.floor(obs.uniqueDeformation * 8);
        const geometry = asteroidGeometries[obs.type][geometryIndex];

        return (
          <group key={i}>
            <Detailed distances={[0, 20, 40]}>
              <mesh
                position={obs.position}
                rotation={obs.rotation}
                scale={obs.scale}
                geometry={geometry}
              >
                <AsteroidMaterial />
              </mesh>
              {/* Lower detail version for distance */}
              <mesh
                position={obs.position}
                rotation={obs.rotation}
                scale={obs.scale}
              >
                <icosahedronGeometry args={[obs.baseRadius, 1]} />
                <AsteroidMaterial />
              </mesh>
              {/* Lowest detail for far distance */}
              <mesh
                position={obs.position}
                rotation={obs.rotation}
                scale={obs.scale}
              >
                <icosahedronGeometry args={[obs.baseRadius, 0]} />
                <AsteroidMaterial />
              </mesh>
            </Detailed>
            <pointLight
              position={obs.position}
              color={obs.color}
              intensity={0.4}
              distance={10}
            />
          </group>
        );
      })}
    </>
  );
};

Scene.propTypes = {
  onObstaclesUpdate: PropTypes.func.isRequired,
};

export default Scene;
