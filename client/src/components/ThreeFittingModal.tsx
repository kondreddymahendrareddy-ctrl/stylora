import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Outfit } from '../types/fashion';
import { X, RotateCcw, ZoomIn, ZoomOut, Play, Pause, Sparkles, CheckCircle2, Box, Shirt, Eye } from 'lucide-react';

import { createFittedThreeTexture } from '../utils/mannequinFitting';

interface ThreeFittingModalProps {
  outfit: Outfit | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThreeFittingModal: React.FC<ThreeFittingModalProps> = ({
  outfit,
  isOpen,
  onClose
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rotationDeg, setRotationDeg] = useState<number>(0);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  const isDraggingRef = useRef<boolean>(false);
  const previousMouseXRef = useRef<number>(0);
  const isAutoRotatingRef = useRef<boolean>(isAutoRotating);

  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // Initialize Three.js WebGL Scene inside modal
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    setIsLoading(true);
    const mount = mountRef.current;
    // Clear any previous canvas
    mount.innerHTML = '';

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 550;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.05, 3.6);
    camera.lookAt(0, 0.9, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 100% TRANSPARENT
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.3);
    mainLight.position.set(3, 5, 4);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xfef3c7, 0.6);
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    // Root Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Load 3D male mannequin fitted with PREFERABLE CLOTHES from outfit
    createFittedThreeTexture(outfit).then((texture) => {
      const aspect = 354 / 561;
      const planeHeight = 2.25;
      const planeWidth = planeHeight * aspect;

      const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const planeMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.35,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      const mannequinMesh = new THREE.Mesh(planeGeo, planeMat);
      mannequinMesh.position.set(0, 0.95, 0);
      modelGroup.add(mannequinMesh);
      setIsLoading(false);
    });

    // Circular pedestal stage
    const pedestalGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.05, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x262626,
      roughness: 0.5,
      metalness: 0.3
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -0.15, 0);
    modelGroup.add(pedestal);

    // Dynamic 3D garment color studio lighting & pedestal ring
    const top = outfit?.pieces?.top;
    const bottom = outfit?.pieces?.bottom;
    const footwear = outfit?.pieces?.footwear;

    const topHex = top?.primaryColor?.hex ? parseInt(top.primaryColor.hex.replace('#', ''), 16) : 0xd4af37;
    const bottomHex = bottom?.primaryColor?.hex ? parseInt(bottom.primaryColor.hex.replace('#', ''), 16) : 0x3b82f6;

    // Runway Accent Ring on Pedestal
    const ringGeo = new THREE.RingGeometry(0.68, 0.73, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: topHex,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(0, -0.12, 0);
    modelGroup.add(ringMesh);

    // Warm outfit rim lights reflecting garment tones onto the mannequin
    const topAccentLight = new THREE.PointLight(topHex, 1.8, 4.5);
    topAccentLight.position.set(0, 1.25, 1.2);
    modelGroup.add(topAccentLight);

    const bottomAccentLight = new THREE.PointLight(bottomHex, 1.2, 3.5);
    bottomAccentLight.position.set(0, 0.45, 1.0);
    modelGroup.add(bottomAccentLight);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isAutoRotatingRef.current && modelGroupRef.current) {
        modelGroupRef.current.rotation.y += 0.008;
        setRotationDeg(Math.round((modelGroupRef.current.rotation.y * (180 / Math.PI)) % 360));
      }

      renderer.render(scene, camera);
    };
    animate();

    const updateSize = () => {
      if (!mount || !cameraRef.current || !rendererRef.current) return;
      const w = mount.clientWidth || 400;
      const h = mount.clientHeight || 550;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(mount);
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen, outfit]);

  // Controls Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMouseXRef.current = e.clientX;
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;
    const deltaX = e.clientX - previousMouseXRef.current;
    modelGroupRef.current.rotation.y += deltaX * 0.012;
    setRotationDeg(Math.round((modelGroupRef.current.rotation.y * (180 / Math.PI)) % 360));
    previousMouseXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZ = Math.max(2.2, Math.min(5.5, cameraRef.current.position.z + delta));
    cameraRef.current.position.z = newZ;
  };

  const handleResetView = () => {
    if (modelGroupRef.current) modelGroupRef.current.rotation.y = 0;
    if (cameraRef.current) cameraRef.current.position.set(0, 1.05, 3.6);
    setIsAutoRotating(true);
    setRotationDeg(0);
  };

  if (!isOpen || !outfit) return null;

  const top = outfit.pieces.top;
  const bottom = outfit.pieces.bottom;
  const footwear = outfit.pieces.footwear;
  const outerwear = outfit.pieces.outerwear;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative bg-[#FBF9F5] w-full max-w-4xl rounded-3xl border border-[#ECE5DB] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 flex items-center justify-center border border-[#ECE5DB] shadow-sm transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Real 3D Model Stage Canvas */}
        <div className="relative flex-1 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 min-h-[420px] md:min-h-[580px] flex items-center justify-center overflow-hidden">
          {/* Subtle Stage Lighting Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          {/* WebGL Canvas */}
          <div
            ref={mountRef}
            className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Loading Fitting State */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/60 backdrop-blur-xs text-xs font-semibold text-white space-y-2 z-10">
              <Sparkles className="w-5 h-5 animate-spin text-amber-400" />
              <span>Fitting selected clothes onto 3D model...</span>
            </div>
          )}

          {/* Floating Camera Controls Toolbar */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-neutral-700/60 shadow-lg text-xs text-white">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`p-1.5 rounded-full transition-all flex items-center space-x-1 text-[11px] font-medium ${
                  isAutoRotating
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                title="Toggle 360° Auto Rotation"
              >
                {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>360° Rotate</span>
              </button>

              <button
                onClick={handleResetView}
                className="p-1.5 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors flex items-center space-x-1 text-[11px]"
                title="Reset Camera"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleZoom(-0.5)}
                className="w-7 h-7 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 flex items-center justify-center transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom(0.5)}
                className="w-7 h-7 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 flex items-center justify-center transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-neutral-400 pl-1">{rotationDeg}°</span>
            </div>
          </div>
        </div>

        {/* Right Side: Fitted Outfit Breakdown & Stylist Notes */}
        <div className="w-full md:w-88 p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-6 bg-white">
          <div className="space-y-4">
            {/* Header Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-bold tracking-wider uppercase">
              <Box className="w-3 h-3 text-amber-300" />
              <span>3D VIRTUAL FITTING</span>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-neutral-900 leading-snug">
              {outfit.name}
            </h3>

            <div className="flex items-center space-x-2 text-xs text-neutral-500">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                {outfit.overallScore}% Harmony
              </span>
              <span className="capitalize">{outfit.occasion.replace(/_/g, ' ')}</span>
            </div>

            {/* Clothes Fitted on Model */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Clothes Worn On 3D Model:
              </h4>

              {top && (
                <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#ECE5DB]">
                  <img
                    src={top.imageUrl}
                    alt={top.name}
                    className="w-11 h-11 object-cover rounded-xl border border-[#ECE5DB] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block">
                      Base Top
                    </span>
                    <h5 className="text-xs font-semibold text-neutral-900 truncate">{top.name}</h5>
                    <p className="text-[10px] text-neutral-500 capitalize">{top.material} • {top.fit} fit</p>
                  </div>
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: top.primaryColor.hex }}
                    title={top.primaryColor.name}
                  />
                </div>
              )}

              {bottom && (
                <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#ECE5DB]">
                  <img
                    src={bottom.imageUrl}
                    alt={bottom.name}
                    className="w-11 h-11 object-cover rounded-xl border border-[#ECE5DB] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block">
                      Trousers / Bottom
                    </span>
                    <h5 className="text-xs font-semibold text-neutral-900 truncate">{bottom.name}</h5>
                    <p className="text-[10px] text-neutral-500 capitalize">{bottom.material} • {bottom.fit} fit</p>
                  </div>
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: bottom.primaryColor.hex }}
                    title={bottom.primaryColor.name}
                  />
                </div>
              )}

              {footwear && (
                <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#ECE5DB]">
                  <img
                    src={footwear.imageUrl}
                    alt={footwear.name}
                    className="w-11 h-11 object-cover rounded-xl border border-[#ECE5DB] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block">
                      Footwear
                    </span>
                    <h5 className="text-xs font-semibold text-neutral-900 truncate">{footwear.name}</h5>
                    <p className="text-[10px] text-neutral-500 capitalize">{footwear.material}</p>
                  </div>
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: footwear.primaryColor.hex }}
                    title={footwear.primaryColor.name}
                  />
                </div>
              )}

              {outerwear && (
                <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#ECE5DB]">
                  <img
                    src={outerwear.imageUrl}
                    alt={outerwear.name}
                    className="w-11 h-11 object-cover rounded-xl border border-[#ECE5DB] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block">
                      Jacket / Outerwear
                    </span>
                    <h5 className="text-xs font-semibold text-neutral-900 truncate">{outerwear.name}</h5>
                    <p className="text-[10px] text-neutral-500 capitalize">{outerwear.material}</p>
                  </div>
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: outerwear.primaryColor.hex }}
                    title={outerwear.primaryColor.name}
                  />
                </div>
              )}
            </div>

            {/* Stylist Pro Tip */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Stylist Fit Advice</span>
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {outfit.stylistRationale.proportionAndFit || outfit.stylistRationale.whyItWorks}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
          >
            Done Viewing 3D Model
          </button>
        </div>
      </div>
    </div>
  );
};
