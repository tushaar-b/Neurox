'use client';

import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Seeded deterministic pseudo-random ───────────────────────────────────────
function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Window/facade canvas texture ────────────────────────────────────────────
function makeWindowTex(seed: number): THREE.CanvasTexture {
  const W = 256, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Dark glass base
  ctx.fillStyle = '#040b18';
  ctx.fillRect(0, 0, W, H);

  const cols = 8, rows = 24;
  const cw = W / cols, ch = H / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Lit windows only ~15-20% overall
      const lit = sr(seed + r * 97 + c * 13) > 0.8;
      if (!lit) continue;
      // ~15% of lit windows are mint green, rest are warm white
      const isMint = sr(seed + r * 211 + c * 37) > 0.85;
      ctx.fillStyle = isMint ? '#34d399' : '#fff8e0';
      ctx.globalAlpha = 0.5 + sr(seed + r * 311 + c * 71) * 0.5;
      // Small distinct squares instead of uniform grid
      ctx.fillRect(c * cw + 6, r * ch + 6, cw - 12, ch - 12);
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Building layout data (deterministic, computed once at module level) ──────
interface BldgData {
  id: number;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  isTower: boolean;
}

const BUILDINGS: BldgData[] = Array.from({ length: 45 }, (_, i) => {
  // Randomize x/z independently, no grid, no mirroring
  const xBase = (sr(i * 13 + 1) - 0.5) * 70; // -35 to 35
  
  // Depth layers
  const zRand = sr(i * 7 + 3);
  let zBase = 0;
  if (zRand > 0.85) {
    zBase = sr(i * 17) * 8; // Foreground
  } else if (zRand < 0.25) {
    zBase = -30 - sr(i * 19) * 20; // Background near horizon
  } else {
    zBase = -5 - sr(i * 23) * 20; // Midground
  }

  const isTower = sr(i * 11 + 7) > 0.80; // ~20% towers

  const w = isTower ? 1.5 + sr(i * 5 + 2) * 2.0 : 2.5 + sr(i * 5 + 2) * 3.5;
  const h = isTower ? 12 + sr(i * 3 + 4) * 16 : 3 + sr(i * 3 + 4) * 7;
  const d = w * (0.6 + sr(i * 9 + 6) * 0.8);

  return { id: i, x: xBase, z: zBase, w, h, d, isTower };
});

// ─── Single building mesh ─────────────────────────────────────────────────────
function Building({ bldg, tex }: { bldg: BldgData; tex: THREE.CanvasTexture }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: bldg.isTower ? '#1a1f2e' : '#2a2f42',
        roughness: 0.15,
        metalness: 0.6,
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.08,
      }),
    [bldg.isTower, tex]
  );

  return (
    <mesh position={[bldg.x, bldg.h / 2, bldg.z]} castShadow receiveShadow material={material}>
      <boxGeometry args={[bldg.w, bldg.h, bldg.d]} />
    </mesh>
  );
}

// ─── Ground plane ─────────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#020408" roughness={0.05} metalness={0.9} />
    </mesh>
  );
}

// ─── BSE dome building (hero centrepiece) ─────────────────────────────────────
function DomeBuilding() {
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a1f2e',
        roughness: 0.1,
        metalness: 0.65,
        emissive: new THREE.Color('#34d399'),
        emissiveIntensity: 0.02,
      }),
    []
  );

  return (
    <group position={[0, 0, -4]}>
      {/* Wide stepped podium base */}
      <mesh position={[0, 0.4, 0]} castShadow material={glassMat}>
        <cylinderGeometry args={[3.5, 3.8, 0.8, 32]} />
      </mesh>
      <mesh position={[0, 1.1, 0.15]} castShadow material={glassMat}>
        <cylinderGeometry args={[2.8, 3.1, 0.6, 32]} />
      </mesh>

      {/* Rotunda drum */}
      <mesh position={[0, 2.1, 0.25]} castShadow material={glassMat}>
        <cylinderGeometry args={[2.5, 2.6, 1.4, 32]} />
      </mesh>
      
      {/* Hemisphere dome cap (squatter) */}
      <mesh position={[0, 2.8, 0.25]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#151a25"
          roughness={0.08}
          metalness={0.7}
          emissive={new THREE.Color('#34d399')}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Stubby finial */}
      <mesh position={[0, 4.6, 0.25]}>
        <cylinderGeometry args={[0.1, 0.2, 0.6, 16]} />
        <meshStandardMaterial color="#34d399" emissive={new THREE.Color('#34d399')} emissiveIntensity={0.8} />
      </mesh>

      {/* Accent lights - reduced intensity drastically */}
      <pointLight position={[-3.5, 3.5, 2.5]} color="#34d399" intensity={2} distance={8} decay={2} />
      <pointLight position={[3.5, 3.5, 2.5]}  color="#34d399" intensity={1.5} distance={8} decay={2} />
    </group>
  );
}

// ─── BSE watermark text (behind buildings via depth) ─────────────────────────
function BSEText() {
  return (
    <Suspense fallback={null}>
      <Text
        position={[0, 4.5, -15]}
        fontSize={3.0}
        letterSpacing={0.15}
        color="#34d399"
        anchorX="center"
        anchorY="middle"
        maxWidth={50}
        overflowWrap="break-word"
      >
        {'BOMBAY STOCK\nEXCHANGE'}
        <meshStandardMaterial
          color="#34d399"
          emissive={new THREE.Color('#34d399')}
          emissiveIntensity={0.8}
          transparent
          opacity={0.35}
          depthTest={true}
        />
      </Text>
    </Suspense>
  );
}

// ─── Lighting rig ─────────────────────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      {/* Ambient */}
      <ambientLight color="#0e1c3a" intensity={2} />
      
      {/* Moonlight — directional, cool white */}
      <directionalLight
        position={[15, 30, 10]}
        color="#e0eaff"
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={80}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      {/* Subtle fill from the opposite side */}
      <directionalLight position={[-15, 10, -10]} color="#0a1530" intensity={0.5} />
      {/* General scene mint glow (very faint) */}
      <pointLight position={[0, 2, -5]} color="#34d399" intensity={0.5} distance={15} decay={2} />
    </>
  );
}

// ─── Mouse-parallax camera controller ────────────────────────────────────────
function ParallaxCamera({ enabled }: { enabled: boolean }) {
  const { camera, mouse } = useThree();

  useFrame(() => {
    if (!enabled) return;
    const tx = mouse.x * 1.8;
    const ty = 2.2 + mouse.y * 0.65;
    camera.position.x += (tx - camera.position.x) * 0.022;
    camera.position.y += (ty - camera.position.y) * 0.022;
    camera.lookAt(0, 3, 0);
  });

  return null;
}

// ─── Buildings group (window textures created on client) ─────────────────────
function Buildings() {
  const textures = useMemo(() => {
    if (typeof window === 'undefined') return [] as THREE.CanvasTexture[];
    return [0, 1, 2, 3, 4, 5, 6].map(i => makeWindowTex(i * 1337));
  }, []);

  if (!textures.length) return null;

  return (
    <>
      {BUILDINGS.map(b => (
        <Building key={b.id} bldg={b} tex={textures[b.id % textures.length]} />
      ))}
    </>
  );
}

// ─── Inner scene tree (inside Canvas context) ─────────────────────────────────
function Scene() {
  const [parallaxEnabled, setParallaxEnabled] = useState(false);

  useEffect(() => {
    setParallaxEnabled(!window.matchMedia('(hover: none)').matches);
  }, []);

  return (
    <>
      {/* Denser fog, fading to navy-black */}
      <fog attach="fog" args={['#050811', 10, 50]} />
      
      <SceneLights />
      <ParallaxCamera enabled={parallaxEnabled} />
      <Ground />
      <DomeBuilding />
      <Buildings />
      <BSEText />

      {/* Post-processing: Bloom & Vignette */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
export function BSEScene() {
  return (
    <Canvas
      camera={{ position: [0, 2.2, 14], fov: 58 }}
      dpr={[1, 1.5]}
      frameloop="always"
      shadows
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
    >
      <Scene />
    </Canvas>
  );
}
