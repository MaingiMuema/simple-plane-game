/* eslint-disable react/no-unknown-property */
import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, KeyboardControls, OrbitControls } from "@react-three/drei";
import Spaceship from "./Spaceship.js";
import Scene from "./Scene.js";
import LoadingScreen from "./LoadingScreen.js";

const Game = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const next = prev + 10;
        if (next >= 100) clearInterval(interval);
        return next > 100 ? 100 : next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <LoadingScreen progress={loadingProgress} />
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp"] },
          { name: "backward", keys: ["ArrowDown"] },
          { name: "left", keys: ["ArrowLeft"] },
          { name: "right", keys: ["ArrowRight"] },
          { name: "ascend", keys: ["KeyW", "w"] },
          { name: "descend", keys: ["KeyS", "s"] },
          { name: "shield", keys: ["KeyE", "e"] },
        ]}
      >
        <div style={{ width: "100vw", height: "100vh" }}>
          <Canvas
            camera={{ position: [0, 20, 50], fov: 60, near: 0.1, far: 1000 }}
            style={{ background: "#000000" }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <Stars />
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                maxDistance={100}
                minDistance={15}
              />
              <Scene />
              <Spaceship />
            </Suspense>
          </Canvas>
        </div>
      </KeyboardControls>
    </>
  );
};

export default Game;
