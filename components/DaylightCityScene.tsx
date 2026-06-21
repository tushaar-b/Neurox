'use client';

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const FINANCIAL_FACTS = [
  "Compound interest is the eighth wonder of the world.",
  "The average daily trading volume of the NYSE is over $200 billion.",
  "A bear market is typically defined as a 20% drop from recent highs.",
  "The first stock market was the Amsterdam Stock Exchange in 1602.",
  "Diversification is the only free lunch in investing.",
  "Historically, the stock market averages 10% annual returns before inflation.",
  "Bulls make money, bears make money, pigs get slaughtered.",
  "The S&P 500 represents about 80% of the total value of the US stock market."
];

// ─── Seeded PRNG ─────────────────────────────────────────────────────────────
function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Procedural Instanced City ───────────────────────────────────────────────
function City() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<any>(null);
  const [popup, setPopup] = useState<{ position: THREE.Vector3; text: string; id: number } | null>(null);
  
  // Safely generate procedural window textures (client-side only to avoid SSR crash)
  const windowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    // Use a subtle color map for walls and windows
    // Dark grey walls
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, 512, 512);
    // Slightly lighter, slightly blue windows
    ctx.fillStyle = '#242830';
    for(let i=0; i<512; i+=32) {
      for(let j=0; j<512; j+=32) {
        if (Math.random() > 0.2) ctx.fillRect(i+2, j+2, 28, 28);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);
  
  // Custom shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOrigin: { value: new THREE.Vector3(0, 0, 0) },
    uClickTime: { value: -1000.0 }, // Start off way in the past so it's invisible
  }), []);

  const handleClick = (e: any) => {
    e.stopPropagation();
    console.log("DaylightCityScene: building clicked!", e.point, "uTime:", uniforms.uTime.value);
    // Make the shockwave originate from where they clicked!
    uniforms.uOrigin.value.copy(e.point);
    // Trigger the animation
    uniforms.uClickTime.value = uniforms.uTime.value;
    
    // Explicitly update active shader uniforms if available
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uOrigin.value.copy(e.point);
      materialRef.current.userData.shader.uniforms.uClickTime.value = uniforms.uTime.value;
    }
    
    // Show random financial fact popup
    const fact = FINANCIAL_FACTS[Math.floor(Math.random() * FINANCIAL_FACTS.length)];
    const popupId = Date.now();
    setPopup({ position: e.point.clone(), text: fact, id: popupId });
    
    // Auto-hide popup after 4 seconds if a new one hasn't been clicked
    setTimeout(() => {
      setPopup((current) => current?.id === popupId ? null : current);
    }, 4000);
  };

  // Generate city grid matrices
  const { count, matrices } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    
    const gridSize = 50; // Increased size
    const spacing = 3.8; // Tighter packing
    
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        const seed = x * 137 + z * 193;
        // Remove wide streets, only occasionally skip a lot to make it intensely crowded
        if (sr(seed) > 0.96) continue;
        
        const distFromCenter = Math.sqrt(x*x + z*z);
        const maxDist = gridSize * 1.4;
        const normalizedDist = 1.0 - Math.min(distFromCenter / maxDist, 1.0);
        
        // 1. Base layer: Thousands of small filler buildings/houses
        let h = 2.0 + sr(seed * 2) * 5;
        let width = 2.8 + sr(seed * 3) * 1.5;
        let depth = 2.8 + sr(seed * 4) * 1.5;
        
        // 2. Skyscrapers: 8% chance, massive height variance, concentrated near center
        if (sr(seed * 5) > 0.92) {
            h = 15 + sr(seed * 6) * 55 * Math.pow(normalizedDist, 1.2);
            width = 3.5 + sr(seed * 7) * 2.0;
            depth = 3.5 + sr(seed * 8) * 2.0;
        }
        
        // 3. Megablocks: 2% chance, huge footprint but medium height
        if (sr(seed * 9) > 0.98) {
            h = 8 + sr(seed * 10) * 15;
            width = 7.0 + sr(seed * 11) * 3.0;
            depth = 7.0 + sr(seed * 12) * 3.0;
        }
        
        dummy.position.set(x * spacing, h / 2, z * spacing);
        dummy.scale.set(width, h, depth);
        dummy.updateMatrix();
        mats.push(dummy.matrix.clone());
      }
    }
    
    return { count: mats.length, matrices: mats };
  }, []);

  // Apply matrices to the InstancedMesh on mount
  useEffect(() => {
    if (meshRef.current) {
      matrices.forEach((mat, i) => {
        meshRef.current!.setMatrixAt(i, mat);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  // Update shader time uniform
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const handleBeforeCompile = useCallback((shader: any) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uOrigin = uniforms.uOrigin;
    shader.uniforms.uClickTime = uniforms.uClickTime;
    
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }
    
    // Inject Varying for World Position into Vertex Shader
    shader.vertexShader = `
      varying vec3 vWorldPos;
      ${shader.vertexShader}
    `.replace(
      `#include <worldpos_vertex>`,
      `#include <worldpos_vertex>
       vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;`
    );
    
    // Inject Shockwave Logic into Fragment Shader
    shader.fragmentShader = `
      uniform float uTime;
      uniform vec3 uOrigin;
      uniform float uClickTime;
      varying vec3 vWorldPos;
      ${shader.fragmentShader}
    `.replace(
      `#include <emissivemap_fragment>`,
      `#include <emissivemap_fragment>
      
      // Calculate horizontal distance from the city center
      float dist = distance(vWorldPos.xz, uOrigin.xz);
      
      // Create an expanding ring originating from the click time
      float timeSinceClick = uTime - uClickTime;
      float speed = 80.0; // Fast moving pulse
      float ringRadius = timeSinceClick * speed;
      float ringThickness = 12.0;
      
      // Glow intensity based on distance to the ring's current radius
      float glow = 1.0 - smoothstep(0.0, ringThickness, abs(dist - ringRadius));
      glow *= step(0.0, timeSinceClick); // Hide if before click time
      
      // Add a horizontal scanline/grid effect inside the glowing area
      float scanline = sin(vWorldPos.y * 2.0 - uTime * 5.0) * 0.5 + 0.5;
      glow *= (0.5 + 0.5 * scanline);
      
      // Fade out the shockwave far away so it doesn't hit the grid edge
      glow *= (1.0 - smoothstep(50.0, 600.0, dist));
      
      // Gold colour mapping (multiplied slightly to lower intensity)
      vec3 glowColor = vec3(0.85, 0.70, 0.51) * glow * 5.0;
      
      totalEmissiveRadiance += glowColor;
      `
    );
  }, [uniforms]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow onClick={handleClick}>
      <boxGeometry args={[1, 1, 1]} />
      {/* 
        The "Blackout" Material:
        Dark base color, highly reflective but low roughness for sleek sharp edges.
      */}
      <meshStandardMaterial
        ref={materialRef}
        map={windowTexture || undefined}
        color="#ffffff" // Let the map dictate the color completely
        emissive="#020202" // Extremely faint baseline so it's not totally pitch black
        metalness={0.6}
        roughness={0.7}
        flatShading={true}
        onBeforeCompile={handleBeforeCompile}
      />
      </instancedMesh>

      {popup && (
        <Html position={[popup.position.x, popup.position.y + 10, popup.position.z]} center zIndexRange={[100, 0]}>
          <div 
            style={{
              background: 'rgba(28, 25, 23, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #352f2a',
              borderLeft: '4px solid #d9b382',
              padding: '16px 24px',
              borderRadius: '4px',
              color: '#f5f0e6',
              fontFamily: 'monospace',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 20px rgba(217, 179, 130, 0.15)',
              transform: 'translateY(-20px)',
            }}
          >
            <div style={{ color: '#d9b382', fontSize: '10px', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '2px' }}>
              // TERMINAL.LOG
            </div>
            {popup.text}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Main Scene ──────────────────────────────────────────────────────────────
function Scene() {
  const { camera } = useThree();

  // Initial camera setup
  useEffect(() => {
    camera.position.set(0, 50, 120);
    camera.lookAt(0, 5, 0);
  }, [camera]);

  // Slow cinematic orbit
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.05;
    camera.position.x = Math.sin(t) * 120;
    camera.position.z = Math.cos(t) * 120;
    camera.lookAt(0, 10, 0);
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      
      {/* Balanced lighting to keep it dark but visible */}
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[100, 100, 50]} color="#ffffff" intensity={2.0} />
      <directionalLight position={[-100, 80, -50]} color="#2244ff" intensity={2.0} />
      
      <City />
      
      <EffectComposer>
        <Bloom 
          luminanceThreshold={1.0} 
          luminanceSmoothing={0.05} 
          intensity={1.5} 
          mipmapBlur 
        />
      </EffectComposer>
    </>
  );
}

// Keep the same export name to avoid breaking page.tsx
export function DaylightCityScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 45 }}
    >
      <Scene />
    </Canvas>
  );
}
