'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text3D } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Seeded deterministic pseudo-random ───────────────────────────────────────
function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Procedural Window Texture ───────────────────────────────────────────────
function createCityTexture(seed: number): THREE.CanvasTexture {
  const W = 256, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Dark glass base
  ctx.fillStyle = '#050a14';
  ctx.fillRect(0, 0, W, H);

  const cols = 10, rows = 30;
  const cw = W / cols, ch = H / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Lit windows ~15%
      const lit = sr(seed + r * 113 + c * 41) > 0.85;
      if (!lit) continue;
      
      // mostly cool white/yellow, some cyan
      const isCyan = sr(seed + r * 211 + c * 37) > 0.9;
      ctx.fillStyle = isCyan ? '#34d399' : '#fff4d6';
      ctx.globalAlpha = 0.6 + sr(seed + r * 311 + c * 71) * 0.4;
      
      ctx.fillRect(c * cw + 4, r * ch + 4, cw - 8, ch - 8);
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── City Scene with Buildings and GSAP Animation ────────────────────────────
function Scene() {
  const { camera, scene } = useThree();
  const buildingsGroup = useRef<THREE.Group>(null);
  
  // Create textures for variety
  const textures = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return [0, 1, 2, 3, 4].map(i => createCityTexture(i * 999));
  }, []);

  // Generate building data
  const buildings = useMemo(() => {
    const data = [];
    const count = 180;
    for (let i = 0; i < count; i++) {
      // Create a long corridor for the camera to fly through
      // Camera flies down the Z axis from positive to negative
      const isRight = sr(i * 13) > 0.5;
      
      // Leave a central gap (street) for the camera path
      const xOffset = 5 + sr(i * 17) * 40;
      const x = isRight ? xOffset : -xOffset;
      
      // Spread buildings along the Z axis from z = 60 to z = -120
      const z = 60 - sr(i * 23) * 180;
      
      const isTower = sr(i * 7) > 0.85;
      const w = 4 + sr(i * 3) * 6;
      const d = 4 + sr(i * 11) * 6;
      const h = isTower ? 30 + sr(i * 19) * 50 : 10 + sr(i * 29) * 20;

      const texIndex = Math.floor(sr(i * 31) * 5);
      
      data.push({ x, z, w, h, d, isTower, texIndex });
    }
    return data;
  }, []);

  useEffect(() => {
    // Initial camera position high up and far back
    camera.position.set(0, 45, 100);
    camera.lookAt(0, 15, 0);

    // Setup GSAP ScrollTrigger to animate the camera
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5, // smooth scrubbing
      }
    });

    // Dive animation sequence
    tl.to(camera.position, {
      z: -20, // fly forward through the text
      y: 4,   // dive down to street level
      ease: 'power1.inOut',
    }, 0);

    // Simultaneously animate where the camera is looking so it tilts up smoothly as it dives
    const lookTarget = { y: 15, z: 0 };
    tl.to(lookTarget, {
      y: 8,
      z: -40,
      ease: 'power1.inOut',
      onUpdate: () => {
        camera.lookAt(0, lookTarget.y, lookTarget.z);
      }
    }, 0);

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [camera]);

  return (
    <>
      {/* Dark foggy atmosphere */}
      <fogExp2 attach="fog" args={['#030610', 0.012]} />

      {/* Lighting */}
      <ambientLight intensity={0.2} color="#111827" />
      
      {/* Directional moonlight */}
      <directionalLight 
        position={[30, 50, -20]} 
        color="#a5b4fc" 
        intensity={1.5} 
        castShadow 
      />
      
      {/* Fill light from opposite side */}
      <directionalLight 
        position={[-30, 20, 20]} 
        color="#1e1b4b" 
        intensity={2.0} 
      />

      {/* 3D Text interwoven in the city */}
      {/* Placed at z=40, so camera at z=100 flies through it on its way to z=-20 */}
      <group position={[0, 25, 40]}>
        {/* We use multiple texts to break up the lines and position them dramatically */}
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={5}
          height={1.5}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.1}
          bevelSize={0.05}
          bevelOffset={0}
          bevelSegments={3}
          position={[-22, 10, 0]}
        >
          DIVE INTO
          <meshStandardMaterial 
            color="#fbbf24" 
            metalness={0.8} 
            roughness={0.2} 
            emissive="#d97706" 
            emissiveIntensity={0.4} 
          />
        </Text3D>
        
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={6}
          height={2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.15}
          bevelSize={0.05}
          bevelOffset={0}
          bevelSegments={3}
          position={[-32, 0, -10]}
        >
          THE WORLD OF
          <meshStandardMaterial 
            color="#fbbf24" 
            metalness={0.8} 
            roughness={0.2} 
            emissive="#d97706" 
            emissiveIntensity={0.6} 
          />
        </Text3D>

        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={8}
          height={2.5}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.2}
          bevelSize={0.1}
          bevelOffset={0}
          bevelSegments={5}
          position={[-20, -10, -20]}
        >
          FINANCE
          <meshStandardMaterial 
            color="#fbbf24" 
            metalness={0.8} 
            roughness={0.2} 
            emissive="#f59e0b" 
            emissiveIntensity={0.8} 
          />
        </Text3D>

        {/* Ambient glow around the text */}
        <pointLight position={[0, 0, -10]} color="#fbbf24" intensity={800} distance={100} />
      </group>

      {/* Buildings */}
      <group ref={buildingsGroup}>
        {textures.length > 0 && buildings.map((b, i) => (
          <mesh 
            key={i} 
            position={[b.x, b.h / 2, b.z]} 
            castShadow 
            receiveShadow
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial 
              color={b.isTower ? '#0f172a' : '#1e293b'}
              metalness={0.6}
              roughness={0.3}
              map={textures[b.texIndex]}
              emissiveMap={textures[b.texIndex]}
              emissive="#ffffff"
              emissiveIntensity={0.05}
            />
          </mesh>
        ))}
      </group>

      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#02040a" roughness={0.1} metalness={0.8} />
      </mesh>
    </>
  );
}

export function CitySkyline() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, background: '#030610' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
