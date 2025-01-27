import * as THREE from "three";

export const checkSphereCollision = (pos1, pos2, radius1, radius2) => {
  const distance = new THREE.Vector3(...pos1).distanceTo(
    new THREE.Vector3(...pos2)
  );
  return distance < radius1 + radius2;
};

export const calculateCollisionResponse = (
  objectPos,
  obstaclePos,
  responseForce = 1
) => {
  const direction = new THREE.Vector3()
    .subVectors(
      new THREE.Vector3(...objectPos),
      new THREE.Vector3(...obstaclePos)
    )
    .normalize();
  return direction.multiplyScalar(responseForce);
};
