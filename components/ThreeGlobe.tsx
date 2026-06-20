'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Dynamic import — DaylightCityScene uses Three.js/WebGL so must be client-only
const DaylightCityScene = dynamic(
  () => import('./DaylightCityScene').then(m => ({ default: m.DaylightCityScene })),
  { ssr: false, loading: () => null }
);

export const ThreeGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const bseOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !particleCanvasRef.current) return;

    // ─── Scene Globals ────────────────────────────────────────────────────────
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let globe: THREE.Mesh;
    let clouds: THREE.Mesh;
    let atmosphere: THREE.Mesh;
    let stars: THREE.Points;
    let animationFrameId: number;
    const globeContainer = containerRef.current;

    let beaconRing: THREE.Mesh | null = null;
    let dotGeom: THREE.SphereGeometry | null = null;
    let dotMat: THREE.MeshBasicMaterial | null = null;
    let ringGeom: THREE.RingGeometry | null = null;
    let ringMat: THREE.MeshBasicMaterial | null = null;

    // Mumbai, India — lat nudged north to correct for Three.js sphere texture offset
    const TARGET_LAT = 22.5;
    const TARGET_LON = 72.8777;

    // ─── Ease function: smooth, patient zoom ─────────────────────────────────
    // Input p: 0→1. Returns eased value 0→1.
    // Feels slow at first then accelerates to Mumbai at end of globe phase
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Globe phase: 0→0.65 of total scroll = rotate & zoom to Mumbai
    // City phase: 0.65→1 of total scroll = fade globe → BSE aerial scene
    const GLOBE_END = 0.65;
    const CITY_START = 0.65;

    // ─── 3D Globe Init ───────────────────────────────────────────────────────
    const initGlobe = () => {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      globeContainer.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
      scene.add(ambientLight);
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
      sunLight.position.set(5, 3, 5);
      scene.add(sunLight);
      const rimLight = new THREE.DirectionalLight(0xd9b382, 0.4);
      rimLight.position.set(-5, -2, -5);
      scene.add(rimLight);

      createEarth();
      createStars();

      window.addEventListener('resize', onResize);
      animate();
    };

    const createEarth = () => {
      const earthGeometry = new THREE.SphereGeometry(1.5, 64, 64);
      const loader = new THREE.TextureLoader();
      const textureUrl = 'https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg';

      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x0d2137,
        shininess: 25,
        specular: new THREE.Color(0x1a3050),
        transparent: true,
        opacity: 1.0,
      });

      globe = new THREE.Mesh(earthGeometry, earthMaterial);
      globe.rotation.reorder('XYZ');
      scene.add(globe);

      loader.load(
        textureUrl,
        (texture) => {
          const mat = globe.material as THREE.MeshPhongMaterial;
          mat.map = texture;
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          loader.load(
            'https://cdn.jsdelivr.net/npm/three-globe@2.41.12/example/img/earth-blue-marble.jpg',
            (texture) => {
              const mat = globe.material as THREE.MeshPhongMaterial;
              mat.map = texture;
              mat.color.set(0xffffff);
              mat.needsUpdate = true;
            },
            undefined,
            () => {
              createProceduralTexture(globe);
            }
          );
        }
      );

      // Mumbai marker
      const latRad = THREE.MathUtils.degToRad(TARGET_LAT);
      const lonRad = THREE.MathUtils.degToRad(TARGET_LON);
      const rMarker = 1.52;

      const markerGroup = new THREE.Group();

      dotGeom = new THREE.SphereGeometry(0.022, 16, 16);
      dotMat = new THREE.MeshBasicMaterial({ color: 0xd9b382 });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.position.set(0, 0, rMarker);
      markerGroup.add(dot);

      ringGeom = new THREE.RingGeometry(0.02, 0.16, 32);
      ringMat = new THREE.MeshBasicMaterial({
        color: 0xd9b382,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      beaconRing = new THREE.Mesh(ringGeom, ringMat);
      beaconRing.position.set(0, 0, rMarker);
      markerGroup.add(beaconRing);

      markerGroup.rotation.y = lonRad + Math.PI / 2;
      markerGroup.rotation.x = -latRad;

      globe.add(markerGroup);

      // Atmosphere
      const atmosphereGeometry = new THREE.SphereGeometry(1.58, 64, 64);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
            gl_FragColor = vec4(0.31, 0.55, 1.0, 1.0) * intensity;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      });
      atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);

      // Clouds
      const cloudCanvas = document.createElement('canvas');
      cloudCanvas.width = 1024;
      cloudCanvas.height = 512;
      const cloudCtx = cloudCanvas.getContext('2d');
      if (cloudCtx) {
        cloudCtx.fillStyle = 'rgba(0, 0, 0, 0)';
        cloudCtx.fillRect(0, 0, 1024, 512);
        cloudCtx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        for (let i = 0; i < 200; i++) {
          const x = Math.random() * 1024;
          const y = Math.random() * 512;
          const w = Math.random() * 60 + 10;
          const h = Math.random() * 12 + 3;
          cloudCtx.beginPath();
          cloudCtx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
          cloudCtx.fill();
        }
      }
      const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
      cloudTexture.wrapS = THREE.RepeatWrapping;
      const cloudGeometry = new THREE.SphereGeometry(1.52, 64, 64);
      const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      });
      clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
      scene.add(clouds);

      globe.rotation.y = 0;
      clouds.rotation.y = 0;
    };

    const createProceduralTexture = (globeMesh: THREE.Mesh) => {
      const earthCanvas = document.createElement('canvas');
      earthCanvas.width = 2048;
      earthCanvas.height = 1024;
      const ctx = earthCanvas.getContext('2d');
      if (!ctx) return;

      const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      oceanGrad.addColorStop(0, '#061224');
      oceanGrad.addColorStop(0.5, '#0d2540');
      oceanGrad.addColorStop(1, '#061224');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#143028';
      ctx.strokeStyle = '#1a4035';
      ctx.lineWidth = 2;
      const continents = [
        [[1050,320],[1080,300],[1110,310],[1130,350],[1140,400],[1140,450],[1130,500],[1110,550],[1090,580],[1060,590],[1040,560],[1030,510],[1020,450],[1015,400],[1025,350]],
        [[350,190],[390,175],[440,185],[490,210],[510,245],[515,280],[505,320],[480,345],[450,355],[420,340],[390,310],[365,280],[345,245],[340,220]],
      ];
      continents.forEach(pts => {
        if (pts.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          const next = pts[(i + 1) % pts.length];
          const xc = (pts[i][0] + next[0]) / 2;
          const yc = (pts[i][1] + next[1]) / 2;
          ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      const pinX = Math.round((TARGET_LON / 360 + 0.5) * 2048);
      const pinY = Math.round((0.5 - TARGET_LAT / 180) * 1024);
      const glowGrad = ctx.createRadialGradient(pinX, pinY, 0, pinX, pinY, 25);
      glowGrad.addColorStop(0, 'rgba(79, 140, 255, 0.9)');
      glowGrad.addColorStop(1, 'rgba(79, 140, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(pinX - 25, pinY - 25, 50, 50);
      ctx.beginPath();
      ctx.arc(pinX, pinY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4f8cff';
      ctx.fill();

      const texture = new THREE.CanvasTexture(earthCanvas);
      const earthMat = globeMesh.material as THREE.MeshPhongMaterial;
      earthMat.map = texture;
      earthMat.color.set(0xffffff);
      earthMat.needsUpdate = true;
    };

    const createStars = () => {
      const starsGeometry = new THREE.BufferGeometry();
      const starsCount = 3000;
      const positions = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount; i++) {
        const i3 = i * 3;
        const radius = 50 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
      }
      starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
      });
      stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Gentle idle spin — only when user hasn't started scrolling
      if (globe && !isTransitioning) {
        globe.rotation.y += 0.0008;
        if (clouds) clouds.rotation.y += 0.001;
      }

      // Pulse beacon ring
      if (beaconRing) {
        const pulseScale = 1.0 + Math.sin(time * 6.5) * 0.55;
        beaconRing.scale.setScalar(pulseScale);
        (beaconRing.material as THREE.MeshBasicMaterial).opacity =
          0.8 - (Math.sin(time * 6.5) + 1) * 0.4;
      }

      renderer.render(scene, camera);
    };

    // ─── Scroll Animation ─────────────────────────────────────────────────────
    let isTransitioning = false;
    let targetProgress = 0;

    // Starting globe rotation (captured when scroll begins)
    let startRotY = 0;
    let startRotX = 0;
    let startCloudRotY = 0;
    let startCloudRotX = 0;

    const lonRad = THREE.MathUtils.degToRad(TARGET_LON);
    const latRad = THREE.MathUtils.degToRad(TARGET_LAT);
    // Final globe rotation to face Mumbai toward camera
    const targetRotY = -lonRad - Math.PI / 2;
    const targetRotX = latRad;

    const progressObj = { value: 0 };

    const updateTransition = () => {
      const p = progressObj.value; // 0→1

      // ── Hero text & scroll prompt ──
      const heroText = document.querySelector('.hero-content-container') as HTMLElement;
      const scrollPrompt = document.querySelector('.scroll-prompt-container') as HTMLElement;
      if (heroText) {
        // Fade out hero text during first 25% of scroll
        const heroFade = Math.max(1 - p / 0.25, 0);
        heroText.style.opacity = heroFade.toString();
        heroText.style.transform = `translateY(${-p * 50}px)`;
        heroText.style.pointerEvents = heroFade > 0.05 ? 'auto' : 'none';
      }
      if (scrollPrompt) {
        scrollPrompt.style.opacity = Math.max(1 - p / 0.2, 0).toString();
        scrollPrompt.style.pointerEvents = p > 0.18 ? 'none' : 'auto';
      }

      // ── Globe phase (0 → GLOBE_END) ──
      if (p < GLOBE_END) {
        // Normalize 0→1 within globe phase then ease it
        const tRaw = p / GLOBE_END; // 0→1
        const t = easeInOutCubic(tRaw);  // smooth, patient ease

        if (globe) {
          globe.visible = true;
          (globe.material as THREE.MeshPhongMaterial).opacity = 1;
          globe.rotation.y = startRotY + (targetRotY - startRotY) * t;
          globe.rotation.x = startRotX + (targetRotX - startRotX) * t;
        }
        if (clouds) {
          clouds.visible = true;
          (clouds.material as THREE.MeshPhongMaterial).opacity = 0.3;
          clouds.rotation.y = startCloudRotY + (targetRotY + 0.05 - startCloudRotY) * t;
          clouds.rotation.x = startCloudRotX + (targetRotX - startCloudRotX) * t;
        }
        if (atmosphere) atmosphere.visible = true;
        if (stars) {
          stars.visible = true;
          (stars.material as THREE.PointsMaterial).opacity = 0.8;
        }

        // Camera zooms in slowly toward Mumbai
        // Phase 1 (t 0→0.8): pull from z=5 → z=2.8, slight down drift
        // Phase 2 (t 0.8→1): close in tightly z=2.8 → z=1.8 (almost touching)
        let camZ: number, camY: number;
        if (t < 0.8) {
          const s = t / 0.8;
          camZ = 5 + (2.8 - 5) * s;
          camY = 0 + (-0.3 - 0) * s;
        } else {
          const s = (t - 0.8) / 0.2;
          camZ = 2.8 + (1.8 - 2.8) * s;
          camY = -0.3 + (-0.55 - (-0.3)) * s;
        }
        camera.position.set(0, camY, camZ);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.updateProjectionMatrix();

        // BSE overlay fully hidden
        if (bseOverlayRef.current) {
          bseOverlayRef.current.style.opacity = '0';
          bseOverlayRef.current.style.pointerEvents = 'none';
        }

        // Dashboard hidden
        const dashboard = document.querySelector('.dashboard-content-container') as HTMLElement;
        if (dashboard) {
          dashboard.style.opacity = '0';
          dashboard.style.pointerEvents = 'none';
          dashboard.style.transform = 'translateY(40px)';
        }

      } else {
        // ── City phase (CITY_START → 1) ──
        const cityT = (p - CITY_START) / (1 - CITY_START); // 0→1
        const eCity = easeInOutCubic(cityT);

        // Globe fades out in first half of city phase
        const globeAlpha = Math.max(1 - eCity * 2.5, 0);

        if (globe) {
          globe.visible = globeAlpha > 0.01;
          globe.rotation.y = targetRotY;
          globe.rotation.x = targetRotX;
          (globe.material as THREE.MeshPhongMaterial).opacity = globeAlpha;
        }
        if (clouds) {
          clouds.visible = globeAlpha > 0.01;
          clouds.rotation.y = targetRotY + 0.05;
          clouds.rotation.x = targetRotX;
          (clouds.material as THREE.MeshPhongMaterial).opacity = 0.3 * globeAlpha;
        }
        if (atmosphere) {
          atmosphere.visible = globeAlpha > 0.01;
        }
        if (stars) {
          stars.visible = globeAlpha > 0.01;
          (stars.material as THREE.PointsMaterial).opacity = 0.8 * globeAlpha;
        }

        // Camera continues descending into city
        const camZ = 1.8 + (-1.0 - 1.8) * eCity;
        const camY = -0.55 + (0.5 - (-0.55)) * eCity;
        camera.position.set(0, camY, camZ);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.updateProjectionMatrix();

        // BSE aerial overlay fades in (starts fading at 20% city phase)
        const overlayAlpha = Math.max(0, (eCity - 0.15) / 0.85);
        if (bseOverlayRef.current) {
          bseOverlayRef.current.style.opacity = overlayAlpha.toString();
          bseOverlayRef.current.style.pointerEvents = overlayAlpha > 0.5 ? 'auto' : 'none';
          // Subtle scale-in (starts zoomed in slightly, settles to 1)
          const scaleVal = 1.08 - eCity * 0.08;
          bseOverlayRef.current.style.transform = `scale(${Math.max(scaleVal, 1)})`;
        }

        // Dashboard fades in at 60%+ of city phase
        const dashboard = document.querySelector('.dashboard-content-container') as HTMLElement;
        if (dashboard) {
          const dp = Math.max(0, (eCity - 0.6) / 0.4);
          dashboard.style.opacity = dp.toString();
          dashboard.style.pointerEvents = dp > 0.5 ? 'auto' : 'none';
          dashboard.style.transform = `translateY(${40 - dp * 40}px)`;
        }
      }
    };

    const initScrollAnimation = () => {
      const handleWheel = (e: WheelEvent) => {
        const dashboard = document.querySelector('.dashboard-content-container');
        if (targetProgress >= 0.99 && dashboard) {
          if (e.deltaY > 0) return;
          const isScrolledToTop = (dashboard as HTMLElement).scrollTop <= 0;
          if (!isScrolledToTop) return;
        }

        const scrollSensitivity = 0.0010; // lower = more patient scroll
        const newProgress = Math.min(Math.max(targetProgress + e.deltaY * scrollSensitivity, 0), 1);

        if (newProgress > 0 && targetProgress === 0) {
          startRotY = globe ? globe.rotation.y : 0;
          startRotX = globe ? globe.rotation.x : 0;
          startCloudRotY = clouds ? clouds.rotation.y : 0;
          startCloudRotX = clouds ? clouds.rotation.x : 0;
          isTransitioning = true;
        } else if (newProgress === 0) {
          isTransitioning = false;
        }

        targetProgress = newProgress;

        gsap.to(progressObj, {
          value: targetProgress,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
          onUpdate: updateTransition,
        });
      };

      let touchStart = 0;
      const handleTouchStart = (e: TouchEvent) => { touchStart = e.touches[0].clientY; };
      const handleTouchMove = (e: TouchEvent) => {
        const deltaY = touchStart - e.touches[0].clientY;
        touchStart = e.touches[0].clientY;

        const dashboard = document.querySelector('.dashboard-content-container');
        if (targetProgress >= 0.99 && dashboard) {
          if (deltaY > 0) return;
          const isScrolledToTop = (dashboard as HTMLElement).scrollTop <= 0;
          if (!isScrolledToTop) return;
        }

        const newProgress = Math.min(Math.max(targetProgress + deltaY * 0.002, 0), 1);

        if (newProgress > 0 && targetProgress === 0) {
          startRotY = globe ? globe.rotation.y : 0;
          startRotX = globe ? globe.rotation.x : 0;
          startCloudRotY = clouds ? clouds.rotation.y : 0;
          startCloudRotX = clouds ? clouds.rotation.x : 0;
          isTransitioning = true;
        } else if (newProgress === 0) {
          isTransitioning = false;
        }

        targetProgress = newProgress;
        gsap.to(progressObj, {
          value: targetProgress,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
          onUpdate: updateTransition,
        });
      };

      window.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });

      return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    };

    // ─── Particles background ──────────────────────────────────────────────────
    let particlesFrameId: number;
    const initParticles = () => {
      const canvas = particleCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const particles: { x: number; y: number; vx: number; vy: number; radius: number; opacity: number }[] = [];
      const particleCount = 60;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }

      const drawParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(79, 140, 255, ${p.opacity})`;
          ctx.fill();

          // Connect nearby particles
          particles.slice(i + 1).forEach((p2) => {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(79, 140, 255, ${0.06 * (1 - dist / 120)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        });
        particlesFrameId = requestAnimationFrame(drawParticles);
      };
      drawParticles();

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    };

    // ─── Boot ─────────────────────────────────────────────────────────────────
    initGlobe();
    const cleanupParticles = initParticles();
    const cleanupScroll = initScrollAnimation();

    // ─── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      cancelAnimationFrame(particlesFrameId);
      cleanupScroll && cleanupScroll();
      cleanupParticles && cleanupParticles();
      window.removeEventListener('resize', onResize);
      if (renderer && globeContainer.contains(renderer.domElement)) {
        globeContainer.removeChild(renderer.domElement);
      }
      if (dotGeom) dotGeom.dispose();
      if (dotMat) dotMat.dispose();
      if (ringGeom) ringGeom.dispose();
      if (ringMat) ringMat.dispose();
      if (renderer) renderer.dispose();
    };
  }, []);

  return (
    <>
      {/* 2D connected particle background canvas */}
      <canvas
        ref={particleCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Three.js globe container */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* ── BSE Aerial City Overlay ─────────────────────────────────────────── */}
      {/* Fades in as globe fades out. Photo-realistic aerial Mumbai/BSE scene.  */}
      <div
        ref={bseOverlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 30,
          opacity: 0,
          pointerEvents: 'none',
          transition: 'none',
          overflow: 'hidden',
        }}
      >
        {/* ── R3F 3D Skyline — replaces static aerial photo ── */}
        {/* DaylightCityScene Canvas sits at z-index 1 (absolute, fills container) */}
        <DaylightCityScene />

        {/* Subtle gradient overlay at bottom for ticker legibility — z-index 2 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background:
              'linear-gradient(to bottom, transparent 0%, transparent 65%, rgba(0,0,0,0.72) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── CTA Button ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <a
            href="/wizard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 42px',
              background: 'linear-gradient(135deg, #e0d6c8, #d9b382)',
              borderRadius: '9999px',
              color: '#110f0d',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '18px',
              fontWeight: 900,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 0 32px rgba(217,179,130,0.35), 0 4px 24px rgba(0,0,0,0.5)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.06)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 48px rgba(217,179,130,0.55), 0 6px 32px rgba(0,0,0,0.6)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 32px rgba(217,179,130,0.35), 0 4px 24px rgba(0,0,0,0.5)';
            }}
          >
            Dive into the World of Finance
          </a>
        </div>

        {/* ── Live Ticker Strip — pinned to bottom of overlay ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(17,15,13,0.85)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #352f2a',
            padding: '11px 0',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', animation: 'marquee 28s linear infinite', gap: '60px', whiteSpace: 'nowrap' }}>
            {[
              { symbol: 'SENSEX', price: '77,301.10', change: '+0.92%', up: true },
              { symbol: 'NIFTY 50', price: '23,516.20', change: '+0.85%', up: true },
              { symbol: 'RELIANCE', price: '2,935.50', change: '+1.45%', up: true },
              { symbol: 'TCS', price: '3,820.15', change: '-0.35%', up: false },
              { symbol: 'HDFCBANK', price: '1,610.80', change: '+1.12%', up: true },
              { symbol: 'INFY', price: '1,485.60', change: '+0.75%', up: true },
              { symbol: 'ICICIBANK', price: '1,120.30', change: '+1.30%', up: true },
              { symbol: 'WIPRO', price: '487.40', change: '-0.55%', up: false },
              { symbol: 'BAJFINANCE', price: '7,125.60', change: '+2.10%', up: true },
              { symbol: 'MARUTI', price: '11,432.00', change: '+0.45%', up: true },
              { symbol: 'LTIM', price: '5,210.30', change: '+1.05%', up: true },
              { symbol: 'ADANIENT', price: '2,840.75', change: '-0.80%', up: false },
              // repeat for seamless loop
              { symbol: 'SENSEX', price: '77,301.10', change: '+0.92%', up: true },
              { symbol: 'NIFTY 50', price: '23,516.20', change: '+0.85%', up: true },
              { symbol: 'RELIANCE', price: '2,935.50', change: '+1.45%', up: true },
              { symbol: 'TCS', price: '3,820.15', change: '-0.35%', up: false },
              { symbol: 'HDFCBANK', price: '1,610.80', change: '+1.12%', up: true },
              { symbol: 'INFY', price: '1,485.60', change: '+0.75%', up: true },
              { symbol: 'ICICIBANK', price: '1,120.30', change: '+1.30%', up: true },
              { symbol: 'WIPRO', price: '487.40', change: '-0.55%', up: false },
              { symbol: 'BAJFINANCE', price: '7,125.60', change: '+2.10%', up: true },
              { symbol: 'MARUTI', price: '11,432.00', change: '+0.45%', up: true },
              { symbol: 'LTIM', price: '5,210.30', change: '+1.05%', up: true },
              { symbol: 'ADANIENT', price: '2,840.75', change: '-0.80%', up: false },
            ].map((item, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                <span style={{ color: '#a89f91' }}>{item.symbol}</span>
                <span style={{ color: '#f5f0e6' }}>{item.price}</span>
                <span style={{ color: item.up ? '#4ade80' : '#f87171' }}>
                  {item.up ? '▲' : '▼'} {item.change}
                </span>
                <span style={{ color: '#352f2a', marginLeft: '10px' }}>|</span>
              </span>
            ))}
          </div>
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </>
  );
};
