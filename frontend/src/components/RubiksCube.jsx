import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function RubiksCube({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(4.5, 3.5, 5.5);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dir1.position.set(5, 8, 5);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x58a6ff, 0.4);
    dir2.position.set(-5, -3, -5);
    scene.add(dir2);
    const dir3 = new THREE.DirectionalLight(0x3fb950, 0.3);
    dir3.position.set(0, 5, -5);
    scene.add(dir3);

    const group = new THREE.Group();
    scene.add(group);

    const gap = 1.05;
    const size = 0.48;

    // GitHub contribution graph colors per face
    // Top = bright green, Front = blue, Right = medium green
    // Bottom = dark, Back = darker green, Left = gray
    const faceColorSets = [
      // +X (right face) — contribution green
      [0x0e4429, 0x006d32, 0x26a641, 0x39d353, 0x26a641, 0x006d32, 0x0e4429, 0x39d353, 0x26a641],
      // -X (left face) — GitHub blue
      [0x0d2d6b, 0x1158c7, 0x388bfd, 0x58a6ff, 0x388bfd, 0x1158c7, 0x0d2d6b, 0x58a6ff, 0x388bfd],
      // +Y (top face) — bright green
      [0x26a641, 0x39d353, 0x26a641, 0x39d353, 0x39d353, 0x26a641, 0x39d353, 0x26a641, 0x39d353],
      // -Y (bottom face) — very dark
      [0x010409, 0x0d1117, 0x161b22, 0x0d1117, 0x010409, 0x161b22, 0x0d1117, 0x161b22, 0x0d1117],
      // +Z (front face) — mixed green/blue
      [0x006d32, 0x388bfd, 0x26a641, 0x58a6ff, 0x26a641, 0x388bfd, 0x006d32, 0x39d353, 0x1158c7],
      // -Z (back face) — purple/dark
      [0x1b1f23, 0x21262d, 0x30363d, 0x21262d, 0x1b1f23, 0x30363d, 0x21262d, 0x30363d, 0x21262d],
    ];

    let cubeIndex = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const geo = new THREE.BoxGeometry(size * 2, size * 2, size * 2);

          const mats = [0,1,2,3,4,5].map((faceIdx) => {
            // Pick a color from the face's palette based on position
            const posIndex = ((x+1)*3 + (y+1)) % 9;
            const colorSet = faceColorSets[faceIdx];
            const baseColor = colorSet[posIndex];

            // Outer faces get brighter colors, inner get darker
            const isOuter =
              (faceIdx === 0 && x === 1) || (faceIdx === 1 && x === -1) ||
              (faceIdx === 2 && y === 1) || (faceIdx === 3 && y === -1) ||
              (faceIdx === 4 && z === 1) || (faceIdx === 5 && z === -1);

            const color = isOuter ? baseColor : 0x0d1117;
            const emissiveColor = isOuter ? baseColor : 0x000000;

            return new THREE.MeshStandardMaterial({
              color,
              roughness: isOuter ? 0.3 : 0.9,
              metalness: isOuter ? 0.4 : 0.1,
              emissive: new THREE.Color(emissiveColor),
              emissiveIntensity: isOuter ? 0.2 : 0,
            });
          });

          const mesh = new THREE.Mesh(geo, mats);
          mesh.position.set(x * gap, y * gap, z * gap);
          group.add(mesh);
          cubeIndex++;
        }
      }
    }

    let rotX = 0.3;
    let rotY = 0.1;
    let velX = 0;
    let velY = 0.004;
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      velX = 0;
      velY = 0;
    };

    const onMouseUp = () => {
      isDragging = false;
      if (Math.abs(velY) < 0.001 && Math.abs(velX) < 0.001) {
        velY = 0.003;
      }
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      velY = (e.clientX - lastMouse.x) * 0.012;
      velX = (e.clientY - lastMouse.y) * 0.012;
      rotY += velY;
      rotX += velX;
      lastMouse = { x: e.clientX, y: e.clientY };
    };

    const onTouchStart = (e) => {
      isDragging = true;
      lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      velX = 0; velY = 0;
    };
    const onTouchEnd = () => {
      isDragging = false;
      if (Math.abs(velY) < 0.001) velY = 0.003;
    };
    const onTouchMove = (e) => {
      if (!isDragging) return;
      velY = (e.touches[0].clientX - lastMouse.x) * 0.012;
      velX = (e.touches[0].clientY - lastMouse.y) * 0.012;
      rotY += velY;
      rotX += velX;
      lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchmove', onTouchMove);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        velY *= 0.98;
        velX *= 0.98;
        if (Math.abs(velY) < 0.002) velY += (0.002 - Math.abs(velY)) * 0.05 * Math.sign(velY || 1);
        rotY += velY;
        rotX += velX;
      }
      group.rotation.x = rotX;
      group.rotation.y = rotY;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchmove', onTouchMove);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
}