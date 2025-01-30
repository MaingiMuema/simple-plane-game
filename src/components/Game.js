/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unknown-property */
import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, KeyboardControls, OrbitControls } from "@react-three/drei";
import Spaceship from "./Spaceship.js";
import Scene from "./Scene.js";
import LoadingScreen from "./LoadingScreen.js";

const Game = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [obstacles, setObstacles] = useState([]);

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
            camera={{ position: [0, 20, 50], fov: 70, near: 0.1, far: 1000 }}
            style={{ background: "#000000" }}
            performance={{ min: 0.5 }} // Add performance limiter
          >
            <Suspense fallback={null}>
              <Scene onObstaclesUpdate={setObstacles} />
              <Spaceship obstacles={obstacles} />
            </Suspense>
          </Canvas>
        </div>
      </KeyboardControls>
    </>
  );
};

export default Game;
