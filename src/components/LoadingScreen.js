import React, { useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import * as THREE from "three";
import "./LoadingScreen.css"; // Create this CSS file

const LoadingScreen = ({ progress = 0 }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(200, 200);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
    });
    const spaceship = new THREE.Mesh(geometry, material);
    scene.add(spaceship);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      spaceship.rotation.x += 0.01;
      spaceship.rotation.y += 0.02;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="loading-container"
      style={{ opacity: progress >= 100 ? 0 : 1 }}
    >
      <canvas ref={canvasRef} style={{ width: 200, height: 200 }} />
      <div className="loading-text">Loading Game</div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

LoadingScreen.propTypes = {
  progress: PropTypes.number
};

export default LoadingScreen;
