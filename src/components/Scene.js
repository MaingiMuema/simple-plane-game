import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Stars, Environment, useTexture, Trail } from '@react-three/drei';
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

  // Initialize obstacles with different shapes and properties
  useMemo(() => {
    const shapes = [
      {
        geometry: 'sphere',
        args: [1, 32, 32],
        material: 'asteroid',
      },
      {
        geometry: 'octahedron',
        args: [1.2],
        material: 'crystal',
      },
      {
        geometry: 'tetrahedron',
        args: [1.5],
        material: 'metallic',
      },
      {
        geometry: 'icosahedron',
        args: [1.3],
        material: 'energy',
      },
    ];

    const newObstacles = Array.from({ length: 50 }).map(() => {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const baseColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
      const scale = Math.random() * 3 + 1;
      
      return {
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
        shape: shape.geometry,
        args: shape.args,
        material: shape.material,
        color: baseColor,
        emissiveColor: baseColor.clone().multiplyScalar(0.5),
        scale,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        pulseSpeed: Math.random() * 2 + 1,
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
    setObstacles(prevObstacles => {
      return prevObstacles.map(obs => {
        const distance = new THREE.Vector3(...obs.position).distanceTo(camera.position);
        if (distance > spaceRadius) {
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
          };
        }
        return {
          ...obs,
          rotation: [
            obs.rotation[0] + obs.rotationSpeed,
            obs.rotation[1] + obs.rotationSpeed,
            obs.rotation[2] + obs.rotationSpeed
          ],
        };
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
      {obstacles.map((obs, i) => {
        const MaterialComponent = () => {
          switch(obs.material) {
            case 'asteroid':
              return (
                <meshStandardMaterial
                  color={obs.color}
                  roughness={0.8}
                  metalness={0.2}
                  bumpScale={0.5}
                />
              );
            case 'crystal':
              return (
                <meshPhysicalMaterial
                  color={obs.color}
                  transmission={0.6}
                  opacity={0.8}
                  metalness={1}
                  roughness={0.1}
                  ior={1.5}
                  thickness={0.5}
                  transparent
                />
              );
            case 'metallic':
              return (
                <meshStandardMaterial
                  color={obs.color}
                  metalness={0.9}
                  roughness={0.1}
                  emissive={obs.emissiveColor}
                  emissiveIntensity={0.3}
                />
              );
            case 'energy':
              return (
                <meshPhongMaterial
                  color={obs.color}
                  emissive={obs.emissiveColor}
                  emissiveIntensity={0.8}
                  transparent
                  opacity={0.9}
                  shininess={100}
                />
              );
          }
        };

        const GeometryComponent = () => {
          switch(obs.shape) {
            case 'sphere':
              return <sphereGeometry args={obs.args} />;
            case 'octahedron':
              return <octahedronGeometry args={obs.args} />;
            case 'tetrahedron':
              return <tetrahedronGeometry args={obs.args} />;
            case 'icosahedron':
              return <icosahedronGeometry args={obs.args} />;
          }
        };

        return (
          <group key={i}>
            <Trail
              width={2}
              length={4}
              color={obs.color}
              attenuation={(t) => t * t}
            >
              <mesh
                position={obs.position}
                rotation={obs.rotation}
                scale={obs.scale}
              >
                <GeometryComponent />
                <MaterialComponent />
              </mesh>
            </Trail>
            <pointLight
              position={obs.position}
              color={obs.color}
              intensity={0.6}
              distance={15}
            />
          </group>
        );
      })}
    </>
  );
};

export default Scene;
