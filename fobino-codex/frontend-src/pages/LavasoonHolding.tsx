import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Sparkles, HelpCircle, CheckCircle, Share2, Fingerprint, 
  ShieldCheck, Lightbulb, Zap, Cpu, Globe, Compass, ArrowRight,
  Briefcase, Code, Palette, TrendingUp, Star, Rocket,
  Layers, X, Maximize2, Minimize2, Eye, EyeOff,
  Volume2, VolumeX, RefreshCw, Grid, Globe as GlobeIcon,
  Hexagon, CircleDot, Diamond, Infinity, Anchor
} from 'lucide-react';

// Sophisticated color palette - deep, rich, elegant
const COLORS = {
  bg: '#0A0A0F',
  surface: '#11131F',
  gold: '#C5A572',
  brightGold: '#E5D5B0',
  darkGold: '#8B7355',
  platinum: '#E8E8F0',
  charcoal: '#1A1C26',
  
  // Category colors - muted, sophisticated
  tech: '#4F6F8F',        // Muted slate blue
  creative: '#9D7E7E',     // Dusty rose
  venture: '#6F8F7A',      // Sage green
  infra: '#B89B7A',        // Warm taupe
  research: '#7A6F8F',     // Lavender gray
  
  accent1: '#C5A572',      // Gold
  accent2: '#8F7A6F',      // Bronze
  accent3: '#6F7A8F',      // Steel blue
};

const CONFIG = {
  particleCount: 1200,
  transitionSpeed: 0.06,
  baseSize: 0.9,
};

const lerp = (start, end, t) => start * (1 - t) + end * t;

// Enhanced project data with elegant positioning
const PROJECTS = [
  // Tech Cluster - positioned in a precise geometric arrangement
  { id: 1, name: "Neural Cloud", category: "tech", icon: Cpu, 
    desc: "AI-powered cloud infrastructure", color: COLORS.tech,
    position: { x: -4.2, y: 1.0, z: -3.2 }, size: 0.75, pulseSpeed: 1.2,
    orbitRadius: 1.0, orbitSpeed: 0.3, glowIntensity: 0.6 },
  { id: 2, name: "Quantum Ledger", category: "tech", icon: Code,
    desc: "Blockchain 3.0 protocol", color: COLORS.tech,
    position: { x: -2.5, y: -0.6, z: -4.0 }, size: 0.7, pulseSpeed: 1.4,
    orbitRadius: 0.9, orbitSpeed: 0.4, glowIntensity: 0.5 },
  { id: 3, name: "Cyber Forge", category: "tech", icon: Zap,
    desc: "Developer tools", color: COLORS.tech,
    position: { x: -5.0, y: -1.2, z: -1.5 }, size: 0.65, pulseSpeed: 1.3,
    orbitRadius: 0.8, orbitSpeed: 0.35, glowIntensity: 0.6 },
  { id: 4, name: "Data Nexus", category: "tech", icon: Globe,
    desc: "Real-time analytics", color: COLORS.tech,
    position: { x: -3.0, y: 1.8, z: -3.5 }, size: 0.7, pulseSpeed: 1.1,
    orbitRadius: 0.95, orbitSpeed: 0.25, glowIntensity: 0.55 },
  
  // Creative Cluster - elegant curve
  { id: 5, name: "Dream Studio", category: "creative", icon: Palette,
    desc: "AI art generation", color: COLORS.creative,
    position: { x: 4.0, y: 1.5, z: -2.2 }, size: 0.75, pulseSpeed: 1.3,
    orbitRadius: 1.0, orbitSpeed: 0.3, glowIntensity: 0.6 },
  { id: 6, name: "Soundscape", category: "creative", icon: Sparkles,
    desc: "Generative music", color: COLORS.creative,
    position: { x: 2.2, y: -1.0, z: -4.2 }, size: 0.7, pulseSpeed: 1.5,
    orbitRadius: 0.9, orbitSpeed: 0.4, glowIntensity: 0.55 },
  { id: 7, name: "Void Gallery", category: "creative", icon: Layers,
    desc: "VR exhibition", color: COLORS.creative,
    position: { x: 5.2, y: -0.4, z: -3.0 }, size: 0.7, pulseSpeed: 1.2,
    orbitRadius: 0.95, orbitSpeed: 0.35, glowIntensity: 0.5 },
  
  // Venture Cluster - precise formation
  { id: 8, name: "Alpha Fund", category: "venture", icon: TrendingUp,
    desc: "Early-stage fund", color: COLORS.venture,
    position: { x: -1.5, y: 2.2, z: 4.0 }, size: 0.75, pulseSpeed: 1.1,
    orbitRadius: 1.0, orbitSpeed: 0.25, glowIntensity: 0.6 },
  { id: 9, name: "Growth Labs", category: "venture", icon: Rocket,
    desc: "Accelerator", color: COLORS.venture,
    position: { x: 1.0, y: 0.5, z: 4.8 }, size: 0.7, pulseSpeed: 1.4,
    orbitRadius: 0.9, orbitSpeed: 0.4, glowIntensity: 0.55 },
  { id: 10, name: "Horizon Capital", category: "venture", icon: Briefcase,
    desc: "Growth equity", color: COLORS.venture,
    position: { x: -2.5, y: -1.0, z: 5.2 }, size: 0.7, pulseSpeed: 1.2,
    orbitRadius: 0.95, orbitSpeed: 0.3, glowIntensity: 0.5 },
  
  // Infrastructure Cluster - balanced
  { id: 11, name: "Eco Grid", category: "infra", icon: Globe,
    desc: "Smart energy network", color: COLORS.infra,
    position: { x: -4.0, y: -1.8, z: 3.2 }, size: 0.7, pulseSpeed: 1.3,
    orbitRadius: 0.9, orbitSpeed: 0.35, glowIntensity: 0.55 },
  { id: 12, name: "Logistics OS", category: "infra", icon: Compass,
    desc: "Supply chain", color: COLORS.infra,
    position: { x: -5.2, y: 1.0, z: 3.8 }, size: 0.65, pulseSpeed: 1.2,
    orbitRadius: 0.85, orbitSpeed: 0.4, glowIntensity: 0.5 },
  { id: 13, name: "Urban Pulse", category: "infra", icon: Zap,
    desc: "Smart city", color: COLORS.infra,
    position: { x: -3.0, y: -1.3, z: 4.8 }, size: 0.65, pulseSpeed: 1.4,
    orbitRadius: 0.85, orbitSpeed: 0.45, glowIntensity: 0.5 },
  
  // Research Cluster - elegant arc
  { id: 14, name: "Bio Compute", category: "research", icon: Cpu,
    desc: "DNA computing", color: COLORS.research,
    position: { x: 3.0, y: -2.0, z: 4.2 }, size: 0.7, pulseSpeed: 1.2,
    orbitRadius: 0.9, orbitSpeed: 0.3, glowIntensity: 0.55 },
  { id: 15, name: "Space Lab", category: "research", icon: Rocket,
    desc: "Aerospace", color: COLORS.research,
    position: { x: 4.8, y: 1.2, z: 3.5 }, size: 0.75, pulseSpeed: 1.1,
    orbitRadius: 1.0, orbitSpeed: 0.25, glowIntensity: 0.6 },
  { id: 16, name: "Quantum AI", category: "research", icon: Fingerprint,
    desc: "Quantum ML", color: COLORS.research,
    position: { x: 3.8, y: -0.7, z: 5.0 }, size: 0.75, pulseSpeed: 1.5,
    orbitRadius: 1.0, orbitSpeed: 0.35, glowIntensity: 0.65 },
];

// Geometric patterns for 2D sections
const getPatternPos = (index, count, w, h, sectionIndex, time) => {
  const cx = w / 2;
  const cy_center = h / 2;
  const cy_top = h * 0.35;
  const size = Math.min(w, h) * 0.25;
  const tTime = time * 0.001;
  const pRatio = index / count;

  switch (sectionIndex) {
    case 0: // RADIANT HORIZON - clean horizontal lines
      const cols = 40;
      const row = Math.floor(index / cols);
      const col = index % cols;
      return [
        col * (w / (cols - 1)),
        h * 0.7 + row * 15 + Math.sin(col * 0.1 + tTime) * 15,
        Math.sin(tTime + index * 0.1) * 30
      ];

    case 1: // SINGULARITY - precise sphere
      const u1 = pRatio * Math.PI * 2;
      const r1 = size * 1.2;
      return [cx + r1 * Math.cos(u1), cy_top + r1 * Math.sin(u1) * 0.5, Math.sin(u1 * 2) * 40];

    case 2: // ENIGMA - perfect sphere
      const phi2 = Math.acos(1 - 2 * pRatio);
      const theta2 = Math.PI * (1 + Math.sqrt(5)) * index;
      return [cx + size * 1.5 * Math.sin(phi2) * Math.cos(theta2), cy_top + size * 1.5 * Math.sin(phi2) * Math.sin(theta2), size * 1.5 * Math.cos(phi2)];

    case 3: // CLARITY - geometric convergence
      return [
        cx + (pRatio - 0.5) * w * 0.8,
        cy_top + Math.sin(pRatio * Math.PI * 2 + tTime) * size,
        Math.cos(pRatio * Math.PI * 2 + tTime) * size
      ];

    case 4: // NEXUS - elegant lattice
      const nA = pRatio * Math.PI * 2;
      return [cx + size * 1.8 * Math.cos(nA), cy_top + size * 1.8 * Math.sin(nA) * 0.6, Math.sin(pRatio * 20 + tTime) * 50];

    case 5: // IDENTITY - double helix
      const hA = pRatio * Math.PI * 10;
      return [cx + Math.cos(hA) * size * 1.2, cy_top + (pRatio - 0.5) * size * 2.2, Math.sin(hA) * size * 1.2];

    case 6: // AEGIS - hexagonal structure
      const hexA = (Math.floor(pRatio * 6) / 6) * Math.PI * 2;
      return [cx + Math.cos(hexA) * size * 1.8, cy_top + Math.sin(hexA) * size * 1.8, Math.sin(tTime) * 30];

    case 7: // INNOVATION - elegant burst
      const t = index * 0.1 + tTime * 2;
      return [cx + Math.cos(t) * size * 0.8, cy_top + Math.sin(t * 1.5) * size, Math.cos(t * 2) * 30];

    case 8: // NEURAL EVOLUTION - flowing wave
      const dnaX = (pRatio - 0.5) * w * 1.5;
      const dnaFreq = pRatio * Math.PI * 12 + tTime * 1.5;
      return [cx + dnaX, cy_center + Math.sin(dnaFreq) * size * 1.0, Math.cos(dnaFreq) * size * 1.0];

    case 9: // PLANETARY SYNC - elegant spiral
      const spiralR = pRatio * w * 0.6;
      const spiralAngle = pRatio * Math.PI * 10 + tTime;
      return [cx + Math.cos(spiralAngle) * spiralR, cy_center + Math.sin(spiralAngle) * spiralR * 0.4, Math.sin(pRatio * 15) * 80];

    case 10: // QUANTUM PATH - subtle chaos
      return [
        cx + (Math.random() - 0.5) * w * 0.8,
        cy_center + (Math.random() - 0.5) * h * 0.6,
        (Math.random() - 0.5) * 500
      ];

    case 11: // LUMINA TECH - smooth wave
      const waveX = (pRatio - 0.5) * w * 2.0;
      const waveY = Math.sin(waveX * 0.002 + tTime * 2) * h * 0.4;
      return [cx + waveX, cy_center + waveY, Math.sin(tTime + pRatio * 10) * 80];

    case 12: // AETHERIA - galactic disk
      const galR = pRatio * w * 0.9;
      const galTheta = pRatio * Math.PI * 12 + tTime * 0.3;
      return [cx + Math.cos(galTheta) * galR, cy_center + Math.sin(galTheta) * galR * 0.3, Math.sin(galTheta * 2) * 60];

    case 13: // VERTEX GLOBAL - tunnel
      const tunZ = ((index * 5 + tTime * 1000) % 2000) - 1000;
      const tunR = w * 0.35;
      return [cx + Math.cos(index) * tunR, cy_center + Math.sin(index) * tunR * 0.5, tunZ];

    default:
      return [cx, cy_top, 0];
  }
};

const LavasoonHoldingPage = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const threeContainerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [is3DActive, setIs3DActive] = useState(false);
  const [show3D, setShow3D] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraZoom, setCameraZoom] = useState(1);
  
  // Three.js refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const spheresRef = useRef([]);
  const connectionsRef = useRef([]);
  const particlesRef = useRef(null);
  const ringsRef = useRef([]);
  const glowSpheresRef = useRef([]);
  const animationFrameRef = useRef(null);
  const controlsRef = useRef({ rotation: 0, targetRotation: 0 });

  const particles = useMemo(() => Array.from({ length: CONFIG.particleCount }).map(() => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    z: 0,
    depth: Math.random() * 2.5,
    sizeMult: Math.random() * 1.2 + 0.3,
  })), []);

  useEffect(() => {
    const fullText = "Amir Hajlou Holding";
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i));
      if (++i > fullText.length) clearInterval(interval);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  // Initialize elegant Three.js scene
  useEffect(() => {
    if (!is3DActive || !threeContainerRef.current) return;

    const container = threeContainerRef.current;
    
    // Scene setup with subtle fog for depth
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.02);
    sceneRef.current = scene;

    // Camera with elegant perspective
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 20);
    cameraRef.current = camera;

    // High-quality renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Sophisticated lighting
    const ambientLight = new THREE.AmbientLight(0x404048);
    scene.add(ambientLight);

    // Key light - warm gold
    const keyLight = new THREE.DirectionalLight(COLORS.gold, 0.8);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    // Fill light - cool
    const fillLight = new THREE.DirectionalLight(COLORS.platinum, 0.4);
    fillLight.position.set(-3, 1, 2);
    scene.add(fillLight);

    // Back light - dramatic
    const backLight = new THREE.DirectionalLight(COLORS.accent3, 0.3);
    backLight.position.set(0, 2, -5);
    scene.add(backLight);

    // Accent lights
    const accentPositions = [
      [5, 2, 5], [-5, -1, 5], [3, 3, -5], [-4, 2, -5]
    ];
    accentPositions.forEach((pos, i) => {
      const light = new THREE.PointLight(COLORS.accent1, 0.2, 20);
      light.position.set(pos[0], pos[1], pos[2]);
      scene.add(light);
    });

    // Central elegant structure - not too bright, sophisticated
    const coreGroup = new THREE.Group();
    
    // Inner core
    const coreGeometry = new THREE.SphereGeometry(0.8, 64, 64);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.gold,
      emissive: COLORS.darkGold,
      roughness: 0.3,
      metalness: 0.7,
      emissiveIntensity: 0.3
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    coreGroup.add(core);

    // Outer shell - transparent
    const shellGeometry = new THREE.SphereGeometry(1.1, 48, 48);
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.gold,
      emissive: COLORS.darkGold,
      transparent: true,
      opacity: 0.1,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    coreGroup.add(shell);

    scene.add(coreGroup);

    // Elegant rings
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.gold,
      emissive: COLORS.darkGold,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      wireframe: true
    });

    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(2.0 + i * 1.0, 0.02, 16, 100);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = (i * Math.PI) / 3;
      scene.add(ring);
      ringsRef.current.push(ring);
    }

    // Create project spheres with elegant styling
    PROJECTS.forEach((project) => {
      const group = new THREE.Group();
      
      // Main sphere - matte finish
      const geometry = new THREE.SphereGeometry(project.size, 48, 48);
      const material = new THREE.MeshStandardMaterial({
        color: project.color,
        roughness: 0.4,
        metalness: 0.3,
        emissive: project.color,
        emissiveIntensity: project.glowIntensity * 0.3,
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.castShadow = false;
      sphere.receiveShadow = false;
      group.add(sphere);
      
      // Subtle inner glow
      const glowGeometry = new THREE.SphereGeometry(project.size * 0.9, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: project.color,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glow);
      
      // Elegant ring - thin and refined
      const ringGeometry = new THREE.TorusGeometry(project.size * 1.4, 0.01, 16, 48);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: project.color,
        emissive: project.color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = Math.random() * Math.PI;
      group.add(ring);
      
      group.position.set(project.position.x, project.position.y, project.position.z);
      group.userData = { project };
      
      scene.add(group);
      spheresRef.current.push(group);
    });

    // Minimal connections - very subtle
    const connectionMaterial = new THREE.LineBasicMaterial({ 
      color: COLORS.gold, 
      transparent: true, 
      opacity: 0.03 
    });
    
    PROJECTS.forEach((p1, i) => {
      PROJECTS.forEach((p2, j) => {
        if (i < j && p1.cluster === p2.cluster) {
          const points = [
            new THREE.Vector3(p1.position.x, p1.position.y, p1.position.z),
            new THREE.Vector3(p2.position.x, p2.position.y, p2.position.z)
          ];
          
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, connectionMaterial);
          scene.add(line);
          connectionsRef.current.push(line);
        }
      });
    });

    // Sophisticated particle field
    const particleCount = 1500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Elliptical distribution
      const r = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      particlePositions[i * 3 + 2] = r * Math.cos(phi);

      // Muted colors - gold and platinum tones
      const shade = 0.6 + Math.random() * 0.3;
      particleColors[i * 3] = COLORS.gold[0] * shade;
      particleColors[i * 3 + 1] = COLORS.gold[1] * shade;
      particleColors[i * 3 + 2] = COLORS.gold[2] * shade;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    particlesRef.current = particleSystem;

    // Animation
    let time = 0;
    
    const animate = () => {
      if (!is3DActive) return;
      
      time += 0.002;

      // Subtle ring rotation
      ringsRef.current.forEach((ring, i) => {
        ring.rotation.y += 0.0005 * (i + 1);
      });

      // Elegant sphere animations
      spheresRef.current.forEach((group, i) => {
        const project = group.userData.project;
        
        // Very subtle pulse
        const pulse = 1 + Math.sin(time * project.pulseSpeed + i) * 0.02;
        group.scale.set(pulse, pulse, pulse);
        
        // Minimal floating
        group.position.y += Math.sin(time * 1.5 + i) * 0.001;
        
        // Rotate rings inside group
        if (group.children[2]) {
          group.children[2].rotation.y += 0.002;
        }
      });

      // Rotate particle field slowly
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0001;
      }

      // Camera auto-rotation
      if (autoRotate) {
        controlsRef.current.targetRotation += 0.001;
        const radius = 20;
        camera.position.x = Math.sin(controlsRef.current.targetRotation) * radius;
        camera.position.z = Math.cos(controlsRef.current.targetRotation) * radius;
        camera.lookAt(0, 1, 0);
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Mouse interaction
    let isDragging = false;
    let lastMouseX = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      setAutoRotate(false);
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !camera) return;
      
      const deltaX = e.clientX - lastMouseX;
      controlsRef.current.targetRotation += deltaX * 0.003;
      
      const radius = 20;
      camera.position.x = Math.sin(controlsRef.current.targetRotation) * radius;
      camera.position.z = Math.cos(controlsRef.current.targetRotation) * radius;
      camera.lookAt(0, 1, 0);
      
      lastMouseX = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      spheresRef.current = [];
      connectionsRef.current = [];
      ringsRef.current = [];
    };
  }, [is3DActive, autoRotate]);

  // Project selection via raycasting
  useEffect(() => {
    if (!is3DActive || !rendererRef.current || !cameraRef.current || !sceneRef.current) return;

    const handleClick = (event) => {
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(spheresRef.current);

      if (intersects.length > 0) {
        const selectedGroup = intersects[0].object.parent;
        setSelectedProject(selectedGroup.userData.project);
      }
    };

    rendererRef.current.domElement.addEventListener('click', handleClick);

    return () => {
      rendererRef.current?.domElement.removeEventListener('click', handleClick);
    };
  }, [is3DActive]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    const progress = scrollTop / (scrollHeight - clientHeight);
    setScrollProgress(progress);
    const current = Math.min(sections.length - 1, Math.round(progress * (sections.length - 1)));
    setActiveSection(current);
    setIs3DActive(current === 14);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!is3DActive) {
        mouseRef.current.tx = (e.clientX / window.innerWidth - 0.5) * 40;
        mouseRef.current.ty = (e.clientY / window.innerHeight - 0.5) * 40;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [is3DActive]);

  // 2D Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    let frame;

    const render = (time) => {
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;
      
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);
      
      if (!is3DActive) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const [tx_b, ty_b, tz_b] = getPatternPos(i, CONFIG.particleCount, w, h, activeSection, time);
          
          p.x = lerp(p.x, tx_b + mouseRef.current.tx * p.depth, CONFIG.transitionSpeed);
          p.y = lerp(p.y, ty_b + mouseRef.current.ty * p.depth, CONFIG.transitionSpeed);
          p.z = lerp(p.z, tz_b, 0.03);

          const zScale = Math.max(0.1, (p.z + 1000) / 1000);
          const opacity = Math.max(0.1, Math.min(0.6, zScale * 0.5));
          const finalRadius = Math.max(0.2, CONFIG.baseSize * p.sizeMult * zScale * 0.7);
          
          // Elegant color palette for 2D particles
          if (activeSection === 0) {
            ctx.fillStyle = COLORS.gold;
          } else if (activeSection % 3 === 0) {
            ctx.fillStyle = COLORS.platinum;
          } else if (activeSection % 3 === 1) {
            ctx.fillStyle = COLORS.accent2;
          } else {
            ctx.fillStyle = COLORS.accent3;
          }

          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, finalRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      frame = requestAnimationFrame(render);
    };
    
    render(0);
    return () => cancelAnimationFrame(frame);
  }, [activeSection, particles, is3DActive]);

  const mouseRef = useRef({ tx: 0, ty: 0 });

  const sections = [
    { type: 'typing', sub: "Architect of Intelligent Futures" },
    { type: 'compact', icon: Sparkles, title: "Singularity", sub: "Rotating Core" },
    { type: 'compact', icon: HelpCircle, title: "Enigma", sub: "Spherical Shell" },
    { type: 'compact', icon: CheckCircle, title: "Clarity", sub: "Converging Truth" },
    { type: 'compact', icon: Share2, title: "Nexus", sub: "Neural Lattice" },
    { type: 'compact', icon: Fingerprint, title: "Identity", sub: "Double Helix" },
    { type: 'compact', icon: ShieldCheck, title: "Aegis", sub: "Hexagonal Shield" },
    { type: 'compact', icon: Lightbulb, title: "Innovation", sub: "Creative Spark" },
    { type: 'ark', icon: Cpu, title: "Neural Evolution", sub: "Synthesized DNA", content: "Mapping recursive patterns of intelligence, discovering that mathematical constants governing stars dictate global flow." },
    { type: 'ark', icon: Globe, title: "Planetary Sync", sub: "Harmonic Geometry", content: "Nature's signature is written in 1.618. Our systems emulate this harmony for peak data efficiency." },
    { type: 'ark', icon: Compass, title: "Quantum Path", sub: "Probability Flow", content: "Navigating shifting tides of subatomic existence with advanced probabilistic models." },
    { 
      type: 'brand', 
      title: "Lumina Tech", 
      sub: "Portfolio I", 
      image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=600",
      desc: "Neural processing and decentralized structures for global infrastructure."
    },
    { 
      type: 'brand', 
      title: "Aetheria", 
      sub: "Portfolio II", 
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=600",
      desc: "Luxury lifestyle ecosystems integrated with harmonic spatial design."
    },
    { 
      type: 'brand', 
      title: "Vertex Global", 
      sub: "Portfolio III", 
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
      desc: "Capital ventures at the intersection of quantum computing and logistics."
    },
    { 
      type: 'threejs', 
      title: "Project Atlas", 
      sub: "3D Portfolio",
    },
    { type: 'compact', icon: Zap, title: "Ascension", sub: "The Final Vector" },
  ];

  const scrollTo = (idx) => containerRef.current.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' });

  const filteredProjects = filterCategory === 'all' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category === filterCategory);

  const toggle3D = () => {
    setShow3D(!show3D);
  };

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
  };

  return (
    <div className="relative h-screen overflow-hidden text-white bg-[#0A0A0F]">
      {/* Navigation - refined */}
      <nav className="fixed top-0 left-0 w-full z-[100] px-12 py-8 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto cursor-pointer group" onClick={() => scrollTo(0)}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#C5A572]/30 bg-[#0A0A0F]/50 backdrop-blur-md group-hover:border-[#C5A572] transition-all duration-500">
            <span className="font-serif font-light text-[#C5A572] text-2xl tracking-wider">A</span>
          </div>
          <span className="font-serif font-light italic text-[#C5A572] tracking-tight text-2xl hidden sm:block opacity-80 group-hover:opacity-100 transition-opacity">Amir Hajlou</span>
        </div>
        <button className="pointer-events-auto px-8 py-3 rounded-full border border-[#C5A572]/30 text-[#C5A572] text-[10px] uppercase tracking-[0.3em] font-light hover:bg-[#C5A572] hover:text-[#0A0A0F] transition-all duration-700">
          Contact
        </button>
      </nav>

      {/* 3D Controls - elegant and minimal */}
      {activeSection === 14 && show3D && (
        <>
          {/* Top bar - refined */}
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto">
            <div className="flex gap-2 p-1 rounded-full border border-[#C5A572]/20 bg-[#0A0A0F]/80 backdrop-blur-xl">
              <button
                onClick={toggleAutoRotate}
                className={`px-6 py-2 rounded-full transition-all duration-500 text-xs uppercase tracking-[0.2em] font-light ${
                  autoRotate ? 'bg-[#C5A572] text-[#0A0A0F]' : 'text-[#C5A572] hover:bg-[#C5A572]/10'
                }`}
              >
                Auto
              </button>
              <button
                onClick={toggle3D}
                className="px-6 py-2 rounded-full text-[#C5A572] hover:bg-[#C5A572]/10 transition-all duration-500 text-xs uppercase tracking-[0.2em] font-light"
              >
                Hide
              </button>
            </div>
          </div>

          {/* Right panel - vertical category filters */}
          <div className="fixed right-12 top-1/2 -translate-y-1/2 z-[90] pointer-events-auto">
            <div className="p-4 rounded-2xl border border-[#C5A572]/20 bg-[#0A0A0F]/80 backdrop-blur-xl">
              <div className="flex flex-col gap-3">
                {['all', 'tech', 'creative', 'venture', 'infra', 'research'].map(cat => {
                  const colors = {
                    all: COLORS.gold,
                    tech: COLORS.tech,
                    creative: COLORS.creative,
                    venture: COLORS.venture,
                    infra: COLORS.infra,
                    research: COLORS.research
                  };
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilterCategory(cat);
                        if (spheresRef.current.length > 0) {
                          spheresRef.current.forEach(group => {
                            const project = group.userData.project;
                            const material = group.children[0].material;
                            if (cat === 'all' || project.category === cat) {
                              material.emissiveIntensity = project.glowIntensity * 0.3;
                              group.children[1].material.opacity = 0.1;
                            } else {
                              material.emissiveIntensity = 0.05;
                              group.children[1].material.opacity = 0.02;
                            }
                          });
                        }
                      }}
                      className="group relative"
                      title={cat}
                    >
                      <div 
                        className={`w-8 h-8 rounded-full border transition-all duration-500 ${
                          filterCategory === cat 
                            ? 'border-[#C5A572] scale-110' 
                            : 'border-transparent hover:border-[#C5A572]/30'
                        }`}
                        style={{ 
                          backgroundColor: filterCategory === cat ? colors[cat] : 'transparent',
                        }}
                      />
                      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-[8px] uppercase tracking-[0.2em] text-[#C5A572]/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom info - minimal */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto">
            <div className="px-6 py-3 rounded-full border border-[#C5A572]/20 bg-[#0A0A0F]/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]/60">
                  {filteredProjects.length} projects
                </span>
                <div className="w-px h-3 bg-[#C5A572]/20" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]/60">
                  drag to explore
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Show 3D button when hidden */}
      {activeSection === 14 && !show3D && (
        <button
          onClick={toggle3D}
          className="fixed bottom-8 right-8 z-[90] px-6 py-3 rounded-full border border-[#C5A572] bg-[#0A0A0F]/80 backdrop-blur-xl text-[#C5A572] text-[10px] uppercase tracking-[0.2em] font-light hover:bg-[#C5A572] hover:text-[#0A0A0F] transition-all duration-700"
        >
          Explore Portfolio
        </button>
      )}

      {/* Project Detail Modal - refined */}
      {selectedProject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative max-w-md w-full p-8 rounded-3xl border border-[#C5A572]/30 bg-[#0A0A0F] shadow-2xl">
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 rounded-full border border-[#C5A572]/20 hover:border-[#C5A572]/50 transition-all"
            >
              <X size={14} className="text-[#C5A572]" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${selectedProject.color}20`, border: `1px solid ${selectedProject.color}` }}
              >
                {selectedProject.icon && <selectedProject.icon size={20} color={selectedProject.color} />}
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[0.3em] text-[#C5A572]/50 mb-1">
                  {selectedProject.category}
                </p>
                <h2 className="text-xl font-serif text-white">{selectedProject.name}</h2>
              </div>
            </div>
            
            <p className="text-sm text-white/70 font-light leading-relaxed mb-6">
              {selectedProject.desc}
            </p>
            
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-full border border-[#C5A572] text-[#C5A572] text-[8px] uppercase tracking-[0.2em] font-light hover:bg-[#C5A572] hover:text-[#0A0A0F] transition-all">
                Details
              </button>
              <button className="flex-1 py-2 rounded-full bg-[#C5A572] text-[#0A0A0F] text-[8px] uppercase tracking-[0.2em] font-light hover:bg-[#C5A572]/80 transition-all">
                Visit
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      <main ref={containerRef} onScroll={handleScroll} className="relative z-10 h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar">
        {sections.map((s, idx) => {
          const sectionTop = idx / (sections.length - 1);
          const distance = Math.abs(scrollProgress - sectionTop);
          const opacity = Math.max(0, 1 - distance * 6); 
          const scale = 1 - distance * 0.15;

          if (s.type === 'typing') {
            return (
              <section key={idx} className="h-screen w-full flex flex-col items-center justify-center snap-start relative">
                <div style={{ opacity, transform: `scale(${scale})` }} className="text-center px-4 mb-20 z-20">
                  <h1 className="text-5xl md:text-7xl font-serif font-light italic mb-4 tracking-tighter text-[#C5A572]">
                    {typedText}<span className="animate-pulse opacity-40">|</span>
                  </h1>
                  <p className="text-[10px] font-mono tracking-[0.6em] text-[#C5A572]/40 uppercase">{s.sub}</p>
                </div>
              </section>
            );
          }

          if (s.type === 'threejs') {
            return (
              <section key={idx} className="h-screen w-full snap-start relative overflow-hidden">
                {show3D ? (
                  <>
                    <div 
                      ref={threeContainerRef} 
                      className="absolute inset-0 w-full h-full"
                    />
                    
                    {/* Title overlay - minimal */}
                    <div className="absolute top-32 left-12 text-left pointer-events-none z-10">
                      <h2 className="text-2xl md:text-3xl font-serif font-light italic text-white/90 mb-1">
                        {s.title}
                      </h2>
                      <p className="text-[8px] font-mono tracking-[0.4em] text-[#C5A572]/60 uppercase">
                        {s.sub}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-3xl md:text-4xl font-serif font-light italic text-white/90 mb-3">
                        {s.title}
                      </h2>
                      <p className="text-[8px] font-mono tracking-[0.4em] text-[#C5A572]/60 uppercase mb-8">
                        {s.sub}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            );
          }

          if (s.type === 'brand') {
            return (
              <section key={idx} className="h-screen w-full flex items-center justify-center snap-start px-4 md:px-6 relative">
                <div 
                  className="w-full max-w-4xl p-8 md:p-16 rounded-[3rem] border border-[#C5A572]/10 bg-[#0A0A0F]/40 backdrop-blur-md flex flex-col md:flex-row items-center gap-8 md:gap-12" 
                  style={{ opacity, transform: `translateY(${distance * 200}px) scale(${scale})` }}
                >
                  <div className="w-full md:w-2/5 aspect-square rounded-[2rem] overflow-hidden border border-[#C5A572]/10">
                    <img src={s.image} alt={s.title} className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-all duration-1000" />
                  </div>
                  <div className="w-full md:w-3/5 space-y-4 md:space-y-6">
                    <div>
                      <p className="text-[#C5A572] text-[8px] tracking-[0.6em] uppercase font-light mb-2">{s.sub}</p>
                      <h2 className="text-3xl md:text-5xl font-serif font-light italic text-white mb-4 leading-tight">{s.title}</h2>
                      <div className="w-12 h-px bg-[#C5A572]/30" />
                    </div>
                    <p className="text-base md:text-lg text-white/70 font-light leading-relaxed">
                      {s.desc}
                    </p>
                    <button className="flex items-center gap-3 text-[#C5A572] text-[8px] uppercase font-light tracking-[0.3em] group pt-2">
                      Explore <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              </section>
            );
          }

          if (s.type === 'compact') {
            return (
              <section key={idx} className="h-screen w-full flex flex-col items-center justify-end pb-32 snap-start">
                <div className="p-8 rounded-[2rem] border border-[#C5A572]/10 bg-[#0A0A0F]/60 backdrop-blur-xl text-center" style={{ opacity, transform: `translateY(${distance * 100}px)` }}>
                  <s.icon className="mx-auto text-[#C5A572] mb-3" size={20} />
                  <h2 className="text-xl font-serif font-light italic text-white mb-1">{s.title}</h2>
                  <p className="text-[8px] text-[#C5A572]/40 font-light uppercase tracking-[0.3em]">{s.sub}</p>
                </div>
              </section>
            );
          }

          return (
            <section key={idx} className="h-screen w-full flex items-center justify-center snap-start px-4 md:px-6">
              <div className="max-w-3xl w-full p-8 md:p-16 rounded-[3rem] border border-[#C5A572]/10 bg-[#0A0A0F]/30 backdrop-blur-md" style={{ opacity, transform: `translateY(${distance * 100}px)` }}>
                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 mb-6 md:mb-8">
                  <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#C5A572]/5 border border-[#C5A572]/10">
                    <s.icon className="text-[#C5A572]" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-serif font-light italic text-white mb-1">{s.title}</h2>
                    <p className="text-[8px] font-mono tracking-[0.4em] text-[#C5A572]/40 uppercase">{s.sub}</p>
                  </div>
                </div>
                <p className="text-base md:text-xl text-white/80 font-light leading-relaxed">"{s.content}"</p>
              </div>
            </section>
          );
        })}
      </main>

      {/* Scroll indicator - refined */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 hidden lg:flex">
        {sections.map((_, i) => (
          <button 
            key={i} 
            onClick={() => scrollTo(i)} 
            className={`w-px transition-all duration-700 ${
              activeSection === i 
                ? 'h-12 bg-[#C5A572]' 
                : 'h-2 bg-white/10 hover:bg-white/20'
            }`} 
          />
        ))}
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background-color: #0A0A0F; margin: 0; overflow: hidden; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        * { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
};

export default LavasoonHoldingPage;






















// import React, { useEffect, useRef, useState, useMemo } from 'react';
// import { 
//   Sparkles, HelpCircle, CheckCircle, Share2, Fingerprint, 
//   ShieldCheck, Lightbulb, Zap, 
//   Cpu, Globe, Compass, ArrowRight
// } from 'lucide-react';

// const COLORS = {
//   bg: '#0B111B',
//   gold: '#D9B46F',
//   brightGold: '#FFF2CC',
//   darkGold: '#A67C37',
// };

// const CONFIG = {
//   particleCount: 2200, 
//   transitionSpeed: 0.08,
//   baseSize: 0.9, 
// };

// const lerp = (start, end, t) => start * (1 - t) + end * t;

// const rotate3D = (x, y, z, angleX, angleY) => {
//   let cosY = Math.cos(angleY), sinY = Math.sin(angleY);
//   let x1 = x * cosY - z * sinY;
//   let z1 = x * sinY + z * cosY;
//   let cosX = Math.cos(angleX), sinX = Math.sin(angleX);
//   let y2 = y * cosX - z1 * sinX;
//   let z2 = y * sinX + z1 * cosX;
//   return [x1, y2, z2];
// };

// /**
//  * ADVANCED GEOMETRY ENGINE
//  */
// const getPatternPos = (index, count, w, h, sectionIndex, time) => {
//   const cx = w / 2;
//   const cy_center = h / 2;
//   const cy_top = h * 0.35;
//   const size = Math.min(w, h) * 0.25;
//   const tTime = time * 0.0012;
//   const pRatio = index / count;

//   switch (sectionIndex) {
//     case 0: // RADIANT HORIZON
//       const cols0 = 50;
//       return [(index % cols0) * (w / (cols0 - 1)), h * 0.8 + (Math.floor(index / cols0) * 12) + Math.sin((index % cols0) * 0.2 + tTime) * 30, Math.sin(tTime + index * 0.1) * 60];

//     case 1: // SINGULARITY
//       const u1 = pRatio * Math.PI * 2, v1 = (index % 50) / 50 * Math.PI * 2;
//       const rInner = size * (0.5 + Math.sin(tTime) * 0.1);
//       const [rx1, ry1, rz1] = rotate3D((size + rInner * Math.cos(v1)) * Math.cos(u1), (size + rInner * Math.cos(v1)) * Math.sin(u1), rInner * Math.sin(v1), tTime, tTime * 0.5);
//       return [cx + rx1, cy_top + ry1, rz1];

//     case 2: // ENIGMA
//       const phi2 = Math.acos(-1 + (2 * index) / count);
//       const theta2 = Math.sqrt(count * Math.PI) * phi2;
//       const [rx2, ry2, rz2] = rotate3D(size * Math.sin(phi2) * Math.cos(theta2), size * Math.sin(phi2) * Math.sin(theta2), size * Math.cos(phi2), tTime * 0.3, tTime * 0.8);
//       return [cx + rx2, cy_top + ry2, rz2];

//     case 3: // CLARITY
//       const side = (index % 4);
//       const level = Math.floor(index / 4) / (count / 4);
//       const [rx3, ry3, rz3] = rotate3D((level * size) * (side < 2 ? 1 : -1), (level * size) * (side % 2 === 0 ? 1 : -1), (1 - level) * size * 2 - size, 0, tTime);
//       return [cx + rx3, cy_top + ry3, rz3];

//     case 4: // NEXUS
//       const nA = pRatio * Math.PI * 2 + tTime;
//       return [cx + (size * 1.5) * Math.cos(nA) * Math.sin(pRatio * 20), cy_top + (size * 1.5) * Math.sin(nA) * Math.cos(pRatio * 20), Math.sin(pRatio * 50 + tTime) * 100];

//     case 5: // IDENTITY
//       const hA = pRatio * Math.PI * 10 + tTime;
//       const [rx5, ry5, rz5] = rotate3D(Math.cos(hA + (index % 2 * Math.PI)) * size * 0.8, (pRatio - 0.5) * size * 3, Math.sin(hA + (index % 2 * Math.PI)) * size * 0.8, 0, tTime * 0.2);
//       return [cx + rx5, cy_top + ry5, rz5];

//     case 6: // AEGIS
//       const hexA = (Math.floor(pRatio * 6) / 6) * Math.PI * 2;
//       return [cx + Math.cos(hexA) * size * 1.2 + (index % 10), cy_top + Math.sin(hexA) * size * 1.2 + (index % 10), Math.sin(tTime) * 50];

//     case 7: // INNOVATION (Custom Lightbulb Shape)
//       const bulbScale = size * 1.1;
//       const pType = index % 100; // Distribute particles to different parts of the bulb
      
//       // Part 1: The Heart (Core) - approx 30%
//       if (pType < 30) {
//          const t = (index * 0.5) + tTime * 2;
//          const hScale = bulbScale * 0.025;
//          // Parametric heart formula
//          const hx = 16 * Math.pow(Math.sin(t), 3);
//          const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
//          // Add pulse
//          const pulse = 1 + Math.sin(tTime * 3) * 0.1;
//          return [cx + hx * hScale * pulse, cy_top + hy * hScale * pulse - bulbScale * 0.15, 0];
//       }
//       // Part 2: The Bulb Glass (Sphere/Tear) - approx 40%
//       else if (pType < 70) {
//          const theta = index * 0.1;
//          const sphereR = bulbScale * 0.55;
//          let sx = Math.cos(theta) * sphereR;
//          let sy = Math.sin(theta) * sphereR;
//          // Taper the bottom to look like a bulb
//          if (sy > 0) sx *= (1 - sy/(sphereR * 2.5));
//          return [cx + sx, cy_top + sy - bulbScale * 0.15, 0];
//       }
//       // Part 3: The Rays (Idea) - approx 20%
//       else if (pType < 90) {
//          const rayCount = 5;
//          const rayId = index % rayCount;
//          // Spread rays in a fan at the top
//          const rayAngle = -Math.PI/2 + (rayId - 2) * (Math.PI / 5); 
//          const dist = bulbScale * 0.75 + (Math.random() * bulbScale * 0.3);
//          const rx = Math.cos(rayAngle) * dist;
//          const ry = Math.sin(rayAngle) * dist;
//          return [cx + rx, cy_top + ry - bulbScale * 0.15, Math.sin(tTime * 5 + index) * 20];
//       }
//       // Part 4: The Base (Screw) - approx 10%
//       else {
//          const coilW = bulbScale * 0.2;
//          const coilH = bulbScale * 0.25;
//          const coilY = bulbScale * 0.45; // Offset down
//          const stack = (index % 10) / 10;
//          return [cx + (Math.random()-0.5) * coilW, cy_top + coilY + stack * coilH - bulbScale * 0.15, 0];
//       }

//     // --- WIDE PATTERNS FOR GLASS SECTIONS (8, 9, 10) ---

//     case 8: // NEURAL EVOLUTION (Wide DNA Stream)
//       const dnaX = (pRatio - 0.5) * w * 1.8; 
//       const dnaFreq = pRatio * Math.PI * 12 + tTime;
//       const dnaY = Math.sin(dnaFreq) * size * 0.8;
//       const dnaZ = Math.cos(dnaFreq) * size * 0.8;
//       const strandOffset = index % 2 === 0 ? 1 : -1;
//       return [cx + dnaX, cy_center + dnaY * strandOffset, dnaZ * strandOffset];

//     case 9: // PLANETARY SYNC (Galactic Disk)
//       const spiralR = pRatio * w * 0.6; 
//       const spiralAngle = pRatio * Math.PI * 10 + tTime * 0.5;
//       const spiralX = Math.cos(spiralAngle) * spiralR;
//       const spiralY = Math.sin(spiralAngle) * spiralR * 0.4;
//       return [cx + spiralX, cy_center + spiralY, Math.sin(pRatio * 20) * 100];

//     case 10: // QUANTUM PATH (Cosmic Horizon)
//       const qRadius = (Math.random() + 0.2) * w * 0.8;
//       const qAngle = Math.random() * Math.PI * 2;
//       const qZMod = ((index * 10 + tTime * 1000) % 2000) - 1000;
//       return [
//         cx + Math.cos(qAngle + index) * qRadius * (1 - pRatio), 
//         cy_center + Math.sin(qAngle + index) * qRadius * 0.5, 
//         qZMod
//       ];

//     // --- IMMERSIVE FULL SCREEN BRAND SECTIONS (11, 12, 13) ---

//     case 11: // LUMINA TECH: "THE DIGITAL OCEAN"
//       const waveX = (pRatio - 0.5) * w * 3.0; // Spans 3x screen width
//       const waveZ = (index % 200) * 10 - 1000;
//       const waveY = Math.sin(waveX * 0.0015 + tTime) * Math.cos(waveZ * 0.002 + tTime) * h * 0.6;
//       const [wx, wy, wz] = rotate3D(waveX, waveY, waveZ, 0.4, 0);
//       return [cx + wx, cy_center + wy + h * 0.2, wz];

//     case 12: // AETHERIA: "THE GALACTIC CORE"
//       const galR = pRatio * w * 1.2; 
//       const galTheta = pRatio * Math.PI * 12 + tTime * 0.3; 
//       const gX = Math.cos(galTheta) * galR;
//       const gY = Math.sin(galTheta) * galR * 0.4;
//       const gZ = Math.sin(galTheta) * galR * 0.4;
//       const dustY = Math.sin(index * 0.1 + tTime) * 100;
//       const [rgX, rgY, rgZ] = rotate3D(gX, gY + dustY, gZ, 0.2, tTime * 0.1);
//       return [cx + rgX, cy_center + rgY, rgZ];

//     case 13: // VERTEX GLOBAL: "THE WARP TUNNEL"
//       const tunAngle = (index % 100) / 100 * Math.PI * 2;
//       const tunRad = w * (0.3 + Math.random() * 0.8); 
//       const tunZ = ((index * 5 + tTime * 2000) % 4000) - 2000;
//       const twist = tunZ * 0.0005;
//       const tX = Math.cos(tunAngle + twist) * tunRad;
//       const tY = Math.sin(tunAngle + twist) * tunRad;
//       return [cx + tX, cy_center + tY, tunZ];

//     case 14: // FINAL VORTEX
//       const vA = pRatio * 150 + tTime * 5;
//       return [cx + Math.cos(vA) * (1 - pRatio) * size * 6, cy_center + Math.sin(vA) * (1 - pRatio) * size * 6, -pRatio * 3000 + 1500];

//     default:
//       return [cx, cy_top, 0];
//   }
// };

// const LavasoonHoldingPage = () => {
//   const canvasRef = useRef(null);
//   const containerRef = useRef(null);
//   const [activeSection, setActiveSection] = useState(0);
//   const [scrollProgress, setScrollProgress] = useState(0);
//   const [typedText, setTypedText] = useState("");
//   const mouseRef = useRef({ tx: 0, ty: 0 });

//   const particles = useMemo(() => Array.from({ length: CONFIG.particleCount }).map(() => ({
//     x: Math.random() * window.innerWidth,
//     y: Math.random() * window.innerHeight,
//     z: 0,
//     depth: Math.random() * 2.5,
//     sizeMult: Math.random() * 1.2 + 0.3,
//   })), []);

//   useEffect(() => {
//     const fullText = "Amir Hajlou Holding";
//     let i = 0;
//     const interval = setInterval(() => {
//       setTypedText(fullText.slice(0, i));
//       if (++i > fullText.length) clearInterval(interval);
//     }, 70);
//     return () => clearInterval(interval);
//   }, []);

//   const handleScroll = (e) => {
//     const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
//     const progress = scrollTop / (scrollHeight - clientHeight);
//     setScrollProgress(progress);
//     const current = Math.min(sections.length - 1, Math.round(progress * (sections.length - 1)));
//     if (current !== activeSection) setActiveSection(current);
//   };

//   useEffect(() => {
//     const handleMouseMove = (e) => {
//       mouseRef.current.tx = (e.clientX / window.innerWidth - 0.5) * 60;
//       mouseRef.current.ty = (e.clientY / window.innerHeight - 0.5) * 60;
//     };
//     window.addEventListener('mousemove', handleMouseMove);
//     return () => window.removeEventListener('mousemove', handleMouseMove);
//   }, []);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d', { alpha: false });
//     let frame;

//     const render = (time) => {
//       const w = canvas.width = window.innerWidth;
//       const h = canvas.height = window.innerHeight;
      
//       ctx.globalAlpha = 1.0;
//       ctx.fillStyle = COLORS.bg;
//       ctx.fillRect(0, 0, w, h);
      
//       for (let i = 0; i < particles.length; i++) {
//         const p = particles[i];
//         const [tx_b, ty_b, tz_b] = getPatternPos(i, CONFIG.particleCount, w, h, activeSection, time);
        
//         p.x = lerp(p.x, tx_b + mouseRef.current.tx * p.depth, CONFIG.transitionSpeed);
//         p.y = lerp(p.y, ty_b + mouseRef.current.ty * p.depth, CONFIG.transitionSpeed);
//         p.z = lerp(p.z, tz_b, 0.05);

//         const zScale = Math.max(0.1, (p.z + 1500) / 1500);
//         const opacity = Math.max(0.05, Math.min(0.85, zScale));
//         const finalRadius = Math.max(0.1, CONFIG.baseSize * p.sizeMult * zScale);
        
//         // Special colors for the Lightbulb Heart (Case 7)
//         if (activeSection === 7 && (i % 100 < 30)) {
//             // Make heart core brighter/distinct
//             ctx.fillStyle = COLORS.brightGold;
//         } 
//         // Varied colors for large Brand Sections
//         else if (activeSection >= 11 && activeSection <= 13) {
//            ctx.fillStyle = (i % 3 === 0) ? COLORS.brightGold : (i % 2 === 0 ? COLORS.gold : '#FFFFFF');
//         } else {
//            ctx.fillStyle = (i % 80 === 0) ? COLORS.brightGold : COLORS.gold;
//         }

//         ctx.globalAlpha = opacity;
//         ctx.beginPath();
//         ctx.arc(p.x, p.y, finalRadius, 0, Math.PI * 2);
//         ctx.fill();
//       }
      
//       frame = requestAnimationFrame(render);
//     };
//     render(0);
//     return () => cancelAnimationFrame(frame);
//   }, [activeSection, particles]);

//   const sections = [
//     { type: 'typing', sub: "Architect of Intelligent Futures" },
//     { type: 'compact', icon: Sparkles, title: "Singularity", sub: "Rotating Core" },
//     { type: 'compact', icon: HelpCircle, title: "Enigma", sub: "Spherical Shell" },
//     { type: 'compact', icon: CheckCircle, title: "Clarity", sub: "Converging Truth" },
//     { type: 'compact', icon: Share2, title: "Nexus", sub: "Neural Lattice" },
//     { type: 'compact', icon: Fingerprint, title: "Identity", sub: "Double Helix" },
//     { type: 'compact', icon: ShieldCheck, title: "Aegis", sub: "Hexagonal Shield" },
    
//     // UPDATED Case 7 to match Image: Lightbulb / Innovation
//     { type: 'compact', icon: Lightbulb, title: "Innovation", sub: "Creative Spark" },
    
//     // Glass Container Sections
//     { type: 'ark', icon: Cpu, title: "Neural Evolution", sub: "Synthesized DNA", content: "Mapping recursive patterns of intelligence, discovering that mathematical constants governing stars dictate global flow." },
//     { type: 'ark', icon: Globe, title: "Planetary Sync", sub: "Harmonic Geometry", content: "Nature's signature is written in 1.618. Our systems emulate this harmony for peak data efficiency." },
//     { type: 'ark', icon: Compass, title: "Quantum Path", sub: "Probability Flow", content: "Navigating shifting tides of subatomic existence with advanced probabilistic models." },
    
//     // Brand Showcase Sections
//     { 
//       type: 'brand', 
//       title: "Lumina Tech", 
//       sub: "Portfolio I", 
//       image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=600",
//       desc: "Neural processing and decentralized structures for global infrastructure."
//     },
//     { 
//       type: 'brand', 
//       title: "Aetheria", 
//       sub: "Portfolio II", 
//       image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=600",
//       desc: "Luxury lifestyle ecosystems integrated with harmonic spatial design."
//     },
//     { 
//       type: 'brand', 
//       title: "Vertex Global", 
//       sub: "Portfolio III", 
//       image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
//       desc: "Capital ventures at the intersection of quantum computing and logistics."
//     },
//     { type: 'compact', icon: Zap, title: "Ascension", sub: "The Final Vector" },
//   ];

//   const scrollTo = (idx) => containerRef.current.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' });

//   return (
//     <div className="relative h-screen overflow-hidden text-white bg-[#0B111B]">
//       <nav className="fixed top-0 left-0 w-full z-[100] px-10 py-8 flex items-center justify-between pointer-events-none">
//         <div className="flex items-center gap-4 pointer-events-auto cursor-pointer" onClick={() => scrollTo(0)}>
//           <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#D9B46F]/30 bg-[#0B111B]/50 backdrop-blur-md">
//             <span className="font-serif font-bold text-[#D9B46F] text-2xl italic">A</span>
//           </div>
//           <span className="font-serif italic text-[#D9B46F] tracking-tighter text-2xl hidden sm:block">Amir Hajlou</span>
//         </div>
//         <button className="pointer-events-auto px-8 py-3 rounded-full border border-[#D9B46F]/40 text-[#D9B46F] text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#D9B46F] hover:text-[#0B111B] transition-all">
//           Contact
//         </button>
//       </nav>

//       <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

//       <main ref={containerRef} onScroll={handleScroll} className="relative z-10 h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar">
//         {sections.map((s, idx) => {
//           const sectionTop = idx / (sections.length - 1);
//           const distance = Math.abs(scrollProgress - sectionTop);
//           const opacity = Math.max(0, 1 - distance * 7); 
//           const scale = 1 - distance * 0.2;

//           if (s.type === 'typing') {
//             return (
//               <section key={idx} className="h-screen w-full flex flex-col items-center justify-center snap-start relative">
//                 <div style={{ opacity, transform: `scale(${scale})` }} className="text-center px-4 mb-20 z-20">
//                   <h1 className="text-5xl md:text-7xl font-serif italic mb-4 tracking-tighter text-[#D9B46F]">
//                     {typedText}<span className="animate-pulse opacity-40">|</span>
//                   </h1>
//                   <p className="text-[12px] font-mono tracking-[0.8em] text-[#D9B46F]/50 uppercase">{s.sub}</p>
//                 </div>
//               </section>
//             );
//           }

//           if (s.type === 'brand') {
//             return (
//               <section key={idx} className="h-screen w-full flex items-center justify-center snap-start px-4 md:px-6 relative">
//                 {/* Brand Showcase Section: High Transparency */}
//                 <div 
//                   className="w-full max-w-4xl p-6 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-[#D9B46F]/20 bg-[#0B111B]/10 backdrop-blur-md shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-8 md:gap-12" 
//                   style={{ opacity, transform: `translateY(${distance * 250}px) scale(${scale})` }}
//                 >
//                   <div className="w-full md:w-2/5 aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-[#D9B46F]/20 shadow-2xl shrink-0">
//                     <img src={s.image} alt={s.title} className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-all duration-1000" />
//                   </div>
//                   <div className="w-full md:w-3/5 space-y-4 md:space-y-8">
//                     <div>
//                       <p className="text-[#D9B46F] text-[10px] tracking-[0.6em] uppercase font-bold mb-3">{s.sub}</p>
//                       <h2 className="text-3xl md:text-6xl font-serif italic text-white mb-6 leading-tight tracking-tight break-words">{s.title}</h2>
//                       <div className="w-16 h-px bg-[#D9B46F]/50" />
//                     </div>
//                     <p className="text-lg md:text-xl text-white/80 font-serif italic leading-relaxed">
//                       {s.desc}
//                     </p>
//                     <button className="flex items-center gap-4 text-[#D9B46F] text-[10px] uppercase font-bold tracking-[0.4em] group pt-2">
//                       Explore Asset <ArrowRight size={16} className="group-hover:translate-x-3 transition-transform" />
//                     </button>
//                   </div>
//                 </div>
//               </section>
//             );
//           }

//           if (s.type === 'compact') {
//             return (
//               <section key={idx} className="h-screen w-full flex flex-col items-center justify-end pb-36 snap-start">
//                 <div className="p-10 rounded-[3rem] border border-[#D9B46F]/20 bg-[#0B111B]/80 backdrop-blur-xl text-center shadow-2xl" style={{ opacity, transform: `translateY(${distance * 150}px)` }}>
//                   <s.icon className="mx-auto text-[#D9B46F] mb-4" size={28} />
//                   <h2 className="text-2xl font-serif italic text-white mb-1 tracking-tight">{s.title}</h2>
//                   <p className="text-[10px] text-[#D9B46F]/60 font-bold uppercase tracking-[0.4em]">{s.sub}</p>
//                 </div>
//               </section>
//             );
//           }

//           // Glass Container (Ark) Section
//           return (
//             <section key={idx} className="h-screen w-full flex items-center justify-center snap-start px-4 md:px-6">
//               {/* Increased Transparency (bg/30) and Mobile Title Fix */}
//               <div className="max-w-3xl w-full p-6 md:p-20 rounded-[3rem] md:rounded-[5rem] border border-[#D9B46F]/10 bg-[#0B111B]/30 backdrop-blur-md shadow-2xl" style={{ opacity, transform: `translateY(${distance * 150}px)` }}>
//                 <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 mb-6 md:mb-10">
//                   <div className="w-16 h-16 md:w-auto md:h-auto flex items-center justify-center p-4 md:p-6 rounded-3xl bg-[#D9B46F]/5 border border-[#D9B46F]/20 shrink-0">
//                     <s.icon className="text-[#D9B46F]" size={32} md={44} />
//                   </div>
//                   <div>
//                     {/* Fixed Title Size for Mobile */}
//                     <h2 className="text-2xl md:text-5xl font-serif italic text-white mb-2 leading-tight break-words">{s.title}</h2>
//                     <p className="text-[9px] md:text-[11px] font-mono tracking-[0.4em] md:tracking-[0.6em] text-[#D9B46F]/50 uppercase">{s.sub}</p>
//                   </div>
//                 </div>
//                 <p className="text-lg md:text-3xl text-white/90 leading-relaxed font-serif italic">"{s.content}"</p>
//               </div>
//             </section>
//           );
//         })}
//       </main>

//       <div className="fixed right-10 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 hidden lg:flex">
//         {sections.map((_, i) => (
//           <button key={i} onClick={() => scrollTo(i)} className={`w-1 transition-all duration-700 ${activeSection === i ? 'h-14 bg-[#D9B46F] shadow-[0_0_15px_rgba(217,180,111,0.5)]' : 'h-2 bg-white/5 hover:bg-white/20'}`} />
//         ))}
//       </div>
      
//       <style>{`
//         .hide-scrollbar::-webkit-scrollbar { display: none; }
//         .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
//         body { background-color: #0B111B; margin: 0; overflow: hidden; }
//         @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');
//         * { font-family: 'Playfair Display', serif; }
//       `}</style>
//     </div>
//   );
// };

// export default LavasoonHoldingPage;