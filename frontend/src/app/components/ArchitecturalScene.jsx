"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// High-resolution procedural concrete texture generator
function createDetailedConcreteTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Base architectural concrete neutral warm tone
  ctx.fillStyle = "#c2beba";
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Layer 1 & 2: Micro-aggregate & cement grain noise
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 32;
    // Micro-pores
    const isPore = Math.random() < 0.008;
    const poreDarkness = isPore ? -45 - Math.random() * 30 : 0;
    const val = grain + poreDarkness;

    data[i] = Math.min(255, Math.max(0, data[i] + val));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + val));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + val * 0.95));
  }
  ctx.putImageData(imgData, 0, 0);

  // Layer 3: Faint formwork imperfections & subtle mottling
  ctx.fillStyle = "rgba(160, 155, 150, 0.08)";
  for (let j = 0; j < 40; j++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 20 + Math.random() * 80;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Concrete Bump/Roughness map
function createConcreteBumpMap() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 45;
    const pore = Math.random() < 0.01 ? -80 : 0;
    const c = Math.min(255, Math.max(0, 128 + n + pore));
    data[i] = c;
    data[i + 1] = c;
    data[i + 2] = c;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function ArchitecturalScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene & Studio Lighting Setup (Exact match to minimal pearl-white studio)
    const scene = new THREE.Scene();
    const studioBgColor = 0xebe8e5;
    scene.background = new THREE.Color(studioBgColor);
    scene.fog = new THREE.FogExp2(studioBgColor, 0.022);

    // 2. Camera Setup (Positioned for 45° angle isometric perspective)
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(32, aspect, 0.1, 100);
    camera.position.set(0, 1.4, 9.2);
    camera.lookAt(0, 0.1, 0);

    // 3. High-Quality WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting
    // Soft overall ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    // Main Key Light from upper right
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.6);
    keyLight.position.set(9, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);

    // Subtle counter fill from the left
    const fillLight = new THREE.DirectionalLight(0xe0e6ed, 1.1);
    fillLight.position.set(-8, 6, 6);
    scene.add(fillLight);

    // 5. Materials
    const concreteMap = createDetailedConcreteTexture();
    const concreteBump = createConcreteBumpMap();

    const concreteMaterial = new THREE.MeshStandardMaterial({
      map: concreteMap,
      bumpMap: concreteBump,
      bumpScale: 0.025,
      roughness: 0.82,
      metalness: 0.02,
      color: 0xc4c0bc,
    });

    // Intense warm amber glowing emissive material for the seam
    const amberSeamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffa526,
    });

    // Outer glow rim strip
    const amberGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd17a,
    });

    // 6. Split Architectural Concrete Cube
    const cubeGroup = new THREE.Group();
    // 45 degree rotation to show the center corner and both faces symmetrically
    cubeGroup.rotation.y = Math.PI / 4;
    cubeGroup.position.y = 0.2;
    scene.add(cubeGroup);

    const cubeWidth = 2.4;
    const cubeDepth = 2.4;
    const halfHeight = 1.15;
    const seamGap = 0.055;

    // --- Top Concrete Half ---
    const topHalfGeo = new THREE.BoxGeometry(cubeWidth, halfHeight, cubeDepth);
    const topHalf = new THREE.Mesh(topHalfGeo, concreteMaterial);
    topHalf.position.y = halfHeight / 2 + seamGap / 2;
    topHalf.castShadow = true;
    topHalf.receiveShadow = true;
    cubeGroup.add(topHalf);

    // --- Bottom Concrete Half ---
    const bottomHalfGeo = new THREE.BoxGeometry(cubeWidth, halfHeight, cubeDepth);
    const bottomHalf = new THREE.Mesh(bottomHalfGeo, concreteMaterial);
    bottomHalf.position.y = -(halfHeight / 2 + seamGap / 2);
    bottomHalf.castShadow = true;
    bottomHalf.receiveShadow = true;
    cubeGroup.add(bottomHalf);

    // --- Inner Glowing Amber Core Plate ---
    const seamCoreGeo = new THREE.BoxGeometry(cubeWidth * 0.98, seamGap * 0.9, cubeDepth * 0.98);
    const seamCore = new THREE.Mesh(seamCoreGeo, amberSeamMaterial);
    seamCore.position.y = 0;
    cubeGroup.add(seamCore);

    // --- Perimeter Razor-Thin Glowing Amber Seam Lines ---
    const edgeThickness = 0.035;
    const edgeOffset = cubeWidth / 2 + 0.002;

    // Left face seam line
    const seamLeftGeo = new THREE.BoxGeometry(0.015, edgeThickness, cubeDepth);
    const seamLeft = new THREE.Mesh(seamLeftGeo, amberGlowMaterial);
    seamLeft.position.set(-edgeOffset, 0, 0);
    cubeGroup.add(seamLeft);

    // Right face seam line
    const seamRightGeo = new THREE.BoxGeometry(cubeWidth, edgeThickness, 0.015);
    const seamRight = new THREE.Mesh(seamRightGeo, amberGlowMaterial);
    seamRight.position.set(0, 0, edgeOffset);
    cubeGroup.add(seamRight);

    // Inside warm point light radiating golden light from the seam
    const seamLight = new THREE.PointLight(0xff9900, 3.8, 8, 1.2);
    seamLight.position.set(0, 0, 0);
    cubeGroup.add(seamLight);

    // Corner beacon flare at the front corner
    const cornerLight = new THREE.PointLight(0xffb84d, 2.2, 5, 1.5);
    cornerLight.position.set(cubeWidth / 2, 0, cubeDepth / 2);
    cubeGroup.add(cornerLight);

    // 7. Polished Reflective Studio Ground Plane
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xdfd9d1,
      roughness: 0.52,
      metalness: 0.18,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Soft amber reflection puddle on the floor directly beneath the cube
    const floorGlowCanvas = document.createElement("canvas");
    floorGlowCanvas.width = 256;
    floorGlowCanvas.height = 256;
    const fgCtx = floorGlowCanvas.getContext("2d");
    const fgGrad = fgCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    fgGrad.addColorStop(0, "rgba(245, 166, 35, 0.35)");
    fgGrad.addColorStop(0.35, "rgba(245, 166, 35, 0.12)");
    fgGrad.addColorStop(1, "rgba(245, 166, 35, 0)");
    fgCtx.fillStyle = fgGrad;
    fgCtx.fillRect(0, 0, 256, 256);

    const floorGlowTex = new THREE.CanvasTexture(floorGlowCanvas);
    const floorGlowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 4.5),
      new THREE.MeshBasicMaterial({
        map: floorGlowTex,
        transparent: true,
        blending: THREE.NormalBlending,
      })
    );
    floorGlowMesh.rotation.x = -Math.PI / 2;
    floorGlowMesh.position.y = -2.19;
    scene.add(floorGlowMesh);

    // 8. Interaction: Smooth Mouse Parallax
    let targetRotY = Math.PI / 4;
    let targetRotX = 0;

    const onMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      targetRotY = Math.PI / 4 + normX * 0.25;
      targetRotX = normY * 0.12;
    };

    window.addEventListener("mousemove", onMouseMove);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    // 9. 60 FPS Anti-Gravity Floating Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Gentle anti-gravity floating bobbing
      cubeGroup.position.y = 0.2 + Math.sin(elapsed * 1.4) * 0.08;

      // Subtle dynamic seam light breathing
      const pulse = 1 + Math.sin(elapsed * 2.8) * 0.12;
      seamLight.intensity = 3.8 * pulse;

      // Smooth mouse parallax lerp
      cubeGroup.rotation.y += (targetRotY - cubeGroup.rotation.y) * 0.06;
      cubeGroup.rotation.x += (targetRotX - cubeGroup.rotation.x) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
    />
  );
}
