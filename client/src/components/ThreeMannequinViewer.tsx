import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Outfit, WardrobeItem } from '../types/fashion';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause, Sparkles, CheckCircle2, Info, Shirt, Layers } from 'lucide-react';
import { createFittedThreeTexture } from '../utils/mannequinFitting';

interface ThreeMannequinViewerProps {
  selectedOutfit: Outfit | null;
  wardrobeItems?: WardrobeItem[];
}

export const ThreeMannequinViewer: React.FC<ThreeMannequinViewerProps> = ({
  selectedOutfit,
  wardrobeItems = []
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotationDeg, setRotationDeg] = useState<number>(0);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const mannequinMeshRef = useRef<THREE.Mesh | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef<boolean>(false);
  const previousMouseXRef = useRef<number>(0);
  const isAutoRotatingRef = useRef<boolean>(isAutoRotating);

  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // Update 3D model clothes when selected outfit changes
  useEffect(() => {
    if (!mannequinMeshRef.current) return;
    setIsLoading(true);
    createFittedThreeTexture(selectedOutfit).then((texture) => {
      if (mannequinMeshRef.current) {
        const mat = mannequinMeshRef.current.material as THREE.MeshStandardMaterial;
        mat.map = texture;
        mat.needsUpdate = true;
      }
      setIsLoading(false);
    });
  }, [selectedOutfit]);

  // 1. Initialize Three.js WebGL Scene with Transparent Canvas
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    try {
      setIsLoading(true);
      setHasError(false);

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const width = mount.clientWidth || 320;
      const height = mount.clientHeight || 520;
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 1.05, 3.8);
      camera.lookAt(0, 0.9, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0); // 100% TRANSPARENT BACKGROUND
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      mount.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
      mainLight.position.set(3, 5, 4);
      mainLight.castShadow = true;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xfef3c7, 0.5);
      fillLight.position.set(-3, 3, -2);
      scene.add(fillLight);

      // Model Root Group
      const modelGroup = new THREE.Group();
      scene.add(modelGroup);
      modelGroupRef.current = modelGroup;

      // Load male mannequin fitted with PREFERABLE CLOTHES
      createFittedThreeTexture(selectedOutfit).then((texture) => {
        const aspect = 354 / 561;
        const planeHeight = 2.2;
        const planeWidth = planeHeight * aspect;

        const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const planeMat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          roughness: 0.35,
          metalness: 0.05,
          side: THREE.DoubleSide
        });

        const mannequinPlane = new THREE.Mesh(planeGeo, planeMat);
        mannequinPlane.position.set(0, 0.95, 0);
        mannequinPlane.castShadow = true;
        modelGroup.add(mannequinPlane);
        mannequinMeshRef.current = mannequinPlane;
        setIsLoading(false);
      });

      // Ground Shadow Plane
      const shadowPlaneGeo = new THREE.PlaneGeometry(2.5, 2.5);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.2 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.15;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      // Animation Loop
      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (isAutoRotatingRef.current && modelGroupRef.current) {
          modelGroupRef.current.rotation.y += 0.007;
          setRotationDeg(Math.round((modelGroupRef.current.rotation.y * (180 / Math.PI)) % 360));
        }

        renderer.render(scene, camera);
      };

      animate();

      const updateSize = () => {
        if (!mount || !cameraRef.current || !rendererRef.current) return;
        const w = mount.clientWidth || 320;
        const h = mount.clientHeight || 520;
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
        cancelAnimationFrame(animationFrameId);
        if (renderer.domElement && mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err) {
      console.error('Failed to initialize 3D WebGL scene:', err);
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

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
    setZoomLevel(Math.round((3.8 / newZ) * 100) / 100);
  };

  const handleResetView = () => {
    if (modelGroupRef.current) modelGroupRef.current.rotation.y = 0;
    if (cameraRef.current) cameraRef.current.position.set(0, 1.05, 3.8);
    setIsAutoRotating(true);
    setZoomLevel(1);
    setRotationDeg(0);
  };

  const pieces = selectedOutfit ? selectedOutfit.pieces : null;
  const top = pieces?.top;
  const bottom = pieces?.bottom;
  const footwear = pieces?.footwear;
  const outerwear = pieces?.outerwear;

  const topColor = top?.primaryColor?.hex || '#374151';
  const bottomColor = bottom?.primaryColor?.hex || '#1F2937';
  const shoeColor = footwear?.primaryColor?.hex || '#111827';
  const outerColor = outerwear?.primaryColor?.hex || '#4B5563';

  return (
    <div className="relative w-full h-[580px] bg-transparent flex flex-col justify-between select-none">
      {/* 3D WebGL Canvas Container with 100% TRANSPARENT background */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-xs text-xs font-semibold text-neutral-800 space-x-2">
          <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
          <span>Loading 3D Male Model...</span>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-amber-50/80 rounded-3xl border border-amber-200">
          <p className="text-xs font-semibold text-amber-900">Unable to load 3D scene.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-[11px] bg-neutral-900 text-white px-3 py-1.5 rounded-full font-semibold"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Minimal Floating Controls Toolbar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#ECE5DB] shadow-md text-xs z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded-full transition-colors flex items-center space-x-1 text-[11px] font-medium ${
              isAutoRotating ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
            title="Toggle 360° Auto Rotation"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>Auto Rotate</span>
          </button>

          <button
            onClick={handleResetView}
            className="p-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors flex items-center space-x-1 text-[11px]"
            title="Reset 3D Camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleZoom(-0.5)}
            className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.5)}
            className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Outfit Garments Overlay Panel */}
      <div className="absolute top-4 left-4 right-4 pointer-events-none z-10">
        {selectedOutfit ? (
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#ECE5DB] shadow-lg pointer-events-auto space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <h4 className="font-serif text-sm font-semibold text-neutral-900 truncate max-w-[180px]">
                  {selectedOutfit.name}
                </h4>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 text-white">
                {selectedOutfit.overallScore}% Match
              </span>
            </div>

            {/* Fitted Garments Breakdown Pills */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-neutral-100">
              {top && (
                <div className="flex items-center space-x-2 bg-[#FAF9F6] p-2 rounded-xl border border-[#ECE5DB]">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: topColor }}
                  />
                  <div className="truncate text-[11px]">
                    <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-bold">Top</span>
                    <span className="text-neutral-800 font-semibold truncate block">{top.name}</span>
                  </div>
                </div>
              )}

              {bottom && (
                <div className="flex items-center space-x-2 bg-[#FAF9F6] p-2 rounded-xl border border-[#ECE5DB]">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: bottomColor }}
                  />
                  <div className="truncate text-[11px]">
                    <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-bold">Bottom</span>
                    <span className="text-neutral-800 font-semibold truncate block">{bottom.name}</span>
                  </div>
                </div>
              )}

              {footwear && (
                <div className="flex items-center space-x-2 bg-[#FAF9F6] p-2 rounded-xl border border-[#ECE5DB]">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: shoeColor }}
                  />
                  <div className="truncate text-[11px]">
                    <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-bold">Shoes</span>
                    <span className="text-neutral-800 font-semibold truncate block">{footwear.name}</span>
                  </div>
                </div>
              )}

              {outerwear && (
                <div className="flex items-center space-x-2 bg-[#FAF9F6] p-2 rounded-xl border border-[#ECE5DB]">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: outerColor }}
                  />
                  <div className="truncate text-[11px]">
                    <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-bold">Jacket</span>
                    <span className="text-neutral-800 font-semibold truncate block">{outerwear.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-xs px-4 py-2 rounded-full border border-[#ECE5DB] shadow-xs text-xs text-neutral-600 flex items-center space-x-2 w-max mx-auto">
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Select an outfit to try it on the 3D model.</span>
          </div>
        )}
      </div>
    </div>
  );
};
