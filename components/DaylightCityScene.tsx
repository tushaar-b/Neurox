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

// ─── Shared ref for triggering shockwave from DOM click ──────────────────────
// This bypasses R3F raycasting (which is unreliable on Windows/ANGLE) and
// instead uses manual raycasting triggered by a native DOM click event.
type ShockwaveTrigger = { fire: (x: number, y: number) => void };
const triggerRef: React.MutableRefObject<ShockwaveTrigger | null> = { current: null };

// ─── Procedural Instanced City ───────────────────────────────────────────────
function City() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<any>(null);
  const [popup, setPopup] = useState<{ position: THREE.Vector3; text: string; id: number } | null>(null);
  const { camera, gl } = useThree();
  
  // Custom shader uniforms — stable across renders
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOrigin: { value: new THREE.Vector3(0, 0, 0) },
    uClickTime: { value: -1000.0 },
  }), []);

  // Dark procedural window texture — client-side only (no SSR)
  const windowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    // Dark grey concrete walls
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, 512, 512);
    // Slightly blue-tinted windows
    ctx.fillStyle = '#242830';
    for (let i = 0; i < 512; i += 32) {
      for (let j = 0; j < 512; j += 32) {
        if (Math.random() > 0.2) ctx.fillRect(i + 2, j + 2, 28, 28);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  // Helper: push uniforms to the GPU shader
  const pushUniforms = useCallback(() => {
    if (materialRef.current?.userData.shader) {
      const su = materialRef.current.userData.shader.uniforms;
      su.uOrigin.value.copy(uniforms.uOrigin.value);
      su.uClickTime.value = uniforms.uClickTime.value;
    }
  }, [uniforms]);

  // ─── Cross-platform click handler ────────────────────────────────────────
  // Exposed via triggerRef so the outer DaylightCityScene wrapper can call it
  // from a native DOM 'click' event (bypassing R3F event propagation issues on
  // Windows/ANGLE where pointer events on InstancedMesh can silently fail).
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    // Increase raycaster precision so instanced mesh hit detection is reliable
    raycaster.params.Mesh = { threshold: 0 };

    triggerRef.current = {
      fire(clientX: number, clientY: number) {
        if (!meshRef.current) return;

        const rect = gl.domElement.getBoundingClientRect();
        const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        // Check intersections with the InstancedMesh
        const hits = raycaster.intersectObject(meshRef.current, false);
        if (hits.length === 0) return;

        const point = hits[0].point;

        // Update uniforms
        uniforms.uOrigin.value.copy(point);
        uniforms.uClickTime.value = uniforms.uTime.value;
        pushUniforms();

        console.log('DaylightCityScene: shockwave fired at', point);

        // Show popup
        const fact = FINANCIAL_FACTS[Math.floor(Math.random() * FINANCIAL_FACTS.length)];
        const popupId = Date.now();
        setPopup({ position: point.clone(), text: fact, id: popupId });
        setTimeout(() => {
          setPopup((current) => current?.id === popupId ? null : current);
        }, 4000);
      },
    };

    return () => { triggerRef.current = null; };
  }, [camera, gl, uniforms, pushUniforms]);

  // Generate city grid matrices
  const { count, matrices } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    
    const gridSize = 50;
    const spacing = 3.8;
    
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        const seed = x * 137 + z * 193;
        if (sr(seed) > 0.96) continue;
        
        const distFromCenter = Math.sqrt(x*x + z*z);
        const maxDist = gridSize * 1.4;
        const normalizedDist = 1.0 - Math.min(distFromCenter / maxDist, 1.0);
        
        let h = 2.0 + sr(seed * 2) * 5;
        let width = 2.8 + sr(seed * 3) * 1.5;
        let depth = 2.8 + sr(seed * 4) * 1.5;
        
        if (sr(seed * 5) > 0.92) {
          h = 15 + sr(seed * 6) * 55 * Math.pow(normalizedDist, 1.2);
          width = 3.5 + sr(seed * 7) * 2.0;
          depth = 3.5 + sr(seed * 8) * 2.0;
        }
        
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

  // Apply matrices
  useEffect(() => {
    if (meshRef.current) {
      matrices.forEach((mat, i) => {
        meshRef.current!.setMatrixAt(i, mat);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  // Update shader time uniform every frame
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    if (materialRef.current?.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const handleBeforeCompile = useCallback((shader: any) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uOrigin = uniforms.uOrigin;
    shader.uniforms.uClickTime = uniforms.uClickTime;

    // Store shader ref so we can update uniforms post-compile
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }
    
    // ── Vertex shader: inject vWorldPos ──────────────────────────────────────
    // Anchor: #include <begin_vertex> — present in ALL Three.js vertex shaders
    // on all platforms (OpenGL + Windows ANGLE/DirectX). Avoids the fragile
    // worldpos_vertex chunk which can be absent on ANGLE backends.
    shader.vertexShader = `varying vec3 vWorldPos;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>\n` +
      `vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;`
    );

    // ── Fragment shader: shockwave ────────────────────────────────────────────
    shader.fragmentShader =
      `uniform float uTime;\n` +
      `uniform vec3 uOrigin;\n` +
      `uniform float uClickTime;\n` +
      `varying vec3 vWorldPos;\n` +
      shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <output_fragment>`,
      // Inject BEFORE the final gl_FragColor write so we can add emissive glow
      // on top of the already-lit surface color. output_fragment is ALWAYS
      // present in MeshStandardMaterial regardless of map/emissivemap settings.
      `{
        float dist = distance(vWorldPos.xz, uOrigin.xz);
        float timeSinceClick = uTime - uClickTime;
        float ringRadius = timeSinceClick * 80.0;
        float ringThickness = 12.0;
        float glow = 1.0 - smoothstep(0.0, ringThickness, abs(dist - ringRadius));
        glow *= step(0.0, timeSinceClick);
        float scanline = sin(vWorldPos.y * 2.0 - uTime * 5.0) * 0.5 + 0.5;
        glow *= (0.5 + 0.5 * scanline);
        glow *= (1.0 - smoothstep(50.0, 600.0, dist));
        vec3 glowColor = vec3(0.85, 0.70, 0.51) * glow * 8.0;
        outgoingLight += glowColor;
      }
      #include <output_fragment>`
    );
  }, [uniforms]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {/* 
          flatShading intentionally REMOVED — it conflicts with custom varyings
          (vWorldPos) on Windows ANGLE/DirectX, causing them to be zero in the
          fragment shader. Without flatShading, varyings interpolate correctly
          on all platforms.
        */}
        <meshStandardMaterial
          ref={materialRef}
          map={windowTexture || undefined}
          color="#ffffff"
          emissive="#020202"
          metalness={0.6}
          roughness={0.7}
          onBeforeCompile={handleBeforeCompile}
          customProgramCacheKey={() => 'city-shockwave-v4'}
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

  useEffect(() => {
    camera.position.set(0, 50, 120);
    camera.lookAt(0, 5, 0);
  }, [camera]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.05;
    camera.position.x = Math.sin(t) * 120;
    camera.position.z = Math.cos(t) * 120;
    camera.lookAt(0, 10, 0);
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
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

// ─── Exported Component ───────────────────────────────────────────────────────
export function DaylightCityScene() {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Native DOM click handler — works on ALL browsers/OS including Windows ANGLE.
  // R3F's synthetic pointer events can silently fail on Windows due to ANGLE's
  // event model, so we do the raycasting ourselves via triggerRef.current.fire().
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const handleClick = (e: MouseEvent) => {
      triggerRef.current?.fire(e.clientX, e.clientY);
    };

    wrapper.addEventListener('click', handleClick);
    return () => wrapper.removeEventListener('click', handleClick);
  }, []);

  return (
    <div
      ref={canvasWrapperRef}
      style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 45 }}
        // Disable R3F's own pointer event handling to prevent double-firing
        // and ensure our manual DOM click handler is the single source of truth
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
