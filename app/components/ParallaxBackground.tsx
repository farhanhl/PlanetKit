"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileImage, Scissors, RotateCw, Lock, QrCode, Code, Palette,
  Wrench, Layers, Download, Sparkles, Minimize2, Droplets, Clock,
  Binary, ShieldCheck, KeyRound, Crop, FileText, Hash, Fingerprint,
  Paintbrush, ImageMinus, Globe, Circle, Plus, Square
} from "lucide-react";

interface Particle {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: any;
  baseX: number; // % from left
  baseY: number; // % from top
  size: number;
  scrollSpeed: number;
  color: string;
  rotate: number;
  opacity: number;
  // For idle floating
  floatAmpX: number;
  floatAmpY: number;
  floatFreqX: number;
  floatFreqY: number;
  phaseX: number;
  phaseY: number;
  // Current calculated positions (px) updated in rAF
  currentX: number;
  currentY: number;
}

// Helper to get random number between min and max
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// Initial raw data. We'll hydrate it with floating properties below.
const RAW_PARTICLES = [
  { Icon: FileImage,   x: 4,   y: 8,   size: 34, speed: 0.04, color: "#60A5FA", rotate: -15, opacity: 0.08 },
  { Icon: Circle,      x: 12,  y: 18,  size: 14, speed: 0.02, color: "#60A5FA", rotate: 0,   opacity: 0.1 },
  { Icon: Scissors,    x: 92,  y: 5,   size: 26, speed: 0.09, color: "#34D399", rotate: 20,  opacity: 0.07 },
  { Icon: Plus,        x: 85,  y: 12,  size: 16, speed: 0.03, color: "#34D399", rotate: 45,  opacity: 0.1 },
  { Icon: RotateCw,    x: 15,  y: 28,  size: 24, speed: 0.13, color: "#34D399", rotate: 0,   opacity: 0.09 },
  { Icon: Lock,        x: 83,  y: 27,  size: 26, speed: 0.06, color: "#A78BFA", rotate: -10, opacity: 0.08 },
  { Icon: Circle,      x: 75,  y: 35,  size: 10, speed: 0.05, color: "#A78BFA", rotate: 0,   opacity: 0.08 },
  { Icon: QrCode,      x: 4,   y: 52,  size: 36, speed: 0.10, color: "#22D3EE", rotate: 5,   opacity: 0.06 },
  { Icon: Code,        x: 95,  y: 48,  size: 28, speed: 0.05, color: "#60A5FA", rotate: -5,  opacity: 0.07 },
  { Icon: Plus,        x: 90,  y: 60,  size: 20, speed: 0.04, color: "#60A5FA", rotate: 0,   opacity: 0.1 },
  { Icon: Palette,     x: 48,  y: 6,   size: 30, speed: 0.08, color: "#F472B6", rotate: 15,  opacity: 0.07 },
  { Icon: Wrench,      x: 22,  y: 68,  size: 24, speed: 0.12, color: "#22D3EE", rotate: -20, opacity: 0.08 },
  { Icon: Square,      x: 30,  y: 75,  size: 12, speed: 0.06, color: "#22D3EE", rotate: 15,  opacity: 0.09 },
  { Icon: Layers,      x: 76,  y: 62,  size: 32, speed: 0.06, color: "#34D399", rotate: 10,  opacity: 0.07 },
  { Icon: Download,    x: 38,  y: 18,  size: 26, speed: 0.09, color: "#F472B6", rotate: -8,  opacity: 0.08 },
  { Icon: Sparkles,    x: 64,  y: 13,  size: 28, speed: 0.11, color: "#A78BFA", rotate: 25,  opacity: 0.09 },
  { Icon: Minimize2,   x: 8,   y: 82,  size: 22, speed: 0.07, color: "#FBBF24", rotate: -12, opacity: 0.07 },
  { Icon: Droplets,    x: 86,  y: 78,  size: 30, speed: 0.05, color: "#A78BFA", rotate: 8,   opacity: 0.07 },
  { Icon: Circle,      x: 92,  y: 85,  size: 18, speed: 0.03, color: "#A78BFA", rotate: 0,   opacity: 0.08 },
  { Icon: Clock,       x: 54,  y: 72,  size: 26, speed: 0.10, color: "#22D3EE", rotate: -5,  opacity: 0.08 },
  { Icon: Binary,      x: 28,  y: 88,  size: 24, speed: 0.13, color: "#60A5FA", rotate: 18,  opacity: 0.07 },
  { Icon: ShieldCheck, x: 70,  y: 86,  size: 28, speed: 0.06, color: "#22D3EE", rotate: -15, opacity: 0.07 },
  { Icon: Plus,        x: 60,  y: 92,  size: 14, speed: 0.04, color: "#22D3EE", rotate: 45,  opacity: 0.09 },
  { Icon: KeyRound,    x: 44,  y: 42,  size: 22, speed: 0.15, color: "#FBBF24", rotate: 30,  opacity: 0.06 },
  { Icon: Crop,        x: 18,  y: 48,  size: 26, speed: 0.08, color: "#A78BFA", rotate: -8,  opacity: 0.08 },
  { Icon: FileText,    x: 62,  y: 38,  size: 30, speed: 0.05, color: "#60A5FA", rotate: 12,  opacity: 0.07 },
  { Icon: Hash,        x: 89,  y: 42,  size: 24, speed: 0.11, color: "#FBBF24", rotate: -20, opacity: 0.08 },
  { Icon: Fingerprint, x: 33,  y: 15,  size: 26, speed: 0.09, color: "#22D3EE", rotate: 5,   opacity: 0.07 },
  { Icon: Paintbrush,  x: 57,  y: 55,  size: 22, speed: 0.14, color: "#F472B6", rotate: -25, opacity: 0.06 },
  { Icon: ImageMinus,  x: 12,  y: 38,  size: 24, speed: 0.10, color: "#FBBF24", rotate: 15,  opacity: 0.08 },
  { Icon: Globe,       x: 78,  y: 18,  size: 28, speed: 0.07, color: "#60A5FA", rotate: 0,   opacity: 0.07 },
  { Icon: Square,      x: 25,  y: 35,  size: 16, speed: 0.05, color: "#FBBF24", rotate: 45,  opacity: 0.08 },
];

export default function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  // We keep a mutable ref to particle data so rAF can update them without re-rendering React
  const pRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Initialize particles with randomized float properties
    const initialized: Particle[] = RAW_PARTICLES.map((p, i) => ({
      id: i,
      Icon: p.Icon,
      baseX: p.x,
      baseY: p.y,
      size: p.size,
      scrollSpeed: p.speed,
      color: p.color,
      rotate: p.rotate,
      opacity: p.opacity,
      floatAmpX: rand(10, 30), // moves up to 30px horizontally
      floatAmpY: rand(10, 30), // moves up to 30px vertically
      floatFreqX: rand(0.0005, 0.0015),
      floatFreqY: rand(0.0005, 0.0015),
      phaseX: rand(0, Math.PI * 2),
      phaseY: rand(0, Math.PI * 2),
      currentX: 0,
      currentY: 0,
    }));
    
    setParticles(initialized);
    pRef.current = initialized;
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // NodeList of DOM elements corresponding to each particle
    const domElements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-particle-id]")
    );

    let rafId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);
    resize();

    const maxDistance = 220; // Constellation connection threshold (px)

    const animate = () => {
      const time = Date.now();
      const scrollY = window.scrollY;
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const maxLineAlpha = isLight ? 0.45 : 0.15;

      ctx.clearRect(0, 0, width, height);

      // 1. Update positions (DOM transforms) and record current screen coords
      pRef.current.forEach((p, i) => {
        const el = domElements[i];
        if (!el) return;

        // Idle floating calculation
        const idleX = Math.sin(time * p.floatFreqX + p.phaseX) * p.floatAmpX;
        const idleY = Math.sin(time * p.floatFreqY + p.phaseY) * p.floatAmpY;
        
        // Scroll parallax calculation
        const scrollOffset = scrollY * p.scrollSpeed;

        // Base screen pixel coordinates
        const screenBaseX = (p.baseX / 100) * width;
        const screenBaseY = (p.baseY / 100) * height;

        // Final pixel coordinates on screen
        p.currentX = screenBaseX + idleX;
        p.currentY = screenBaseY - scrollOffset + idleY;

        // Transform DOM element relative to its original % position
        // The element is positioned absolutely at top: baseY%, left: baseX%.
        // We only translate by the offsets.
        el.style.transform = `translate(${idleX}px, ${-scrollOffset + idleY}px) rotate(${p.rotate}deg)`;
      });

      // 2. Draw Constellation Lines
      ctx.lineWidth = 1;
      // Loop over every pair of particles to find nearby ones
      for (let i = 0; i < pRef.current.length; i++) {
        for (let j = i + 1; j < pRef.current.length; j++) {
          const p1 = pRef.current[i];
          const p2 = pRef.current[j];

          // Calculate distance
          const dx = p1.currentX - p2.currentX;
          const dy = p1.currentY - p2.currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            // Opacity is higher when closer, fades out as it nears maxDistance
            const alpha = (1 - dist / maxDistance) * maxLineAlpha; 
            
            // Draw line
            ctx.beginPath();
            ctx.moveTo(p1.currentX + p1.size/2, p1.currentY + p1.size/2); // center to center roughly
            ctx.lineTo(p2.currentX + p2.size/2, p2.currentY + p2.size/2);
            
            // Create a gradient for the line connecting the two colors
            const grad = ctx.createLinearGradient(p1.currentX, p1.currentY, p2.currentX, p2.currentY);
            grad.addColorStop(0, p1.color + Math.round(alpha * 255).toString(16).padStart(2, '0'));
            grad.addColorStop(1, p2.color + Math.round(alpha * 255).toString(16).padStart(2, '0'));
            
            ctx.strokeStyle = grad;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, [particles]); // re-run only when particles are initialized

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Subtle radial vignette — adapts to theme via CSS variable */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, var(--vignette-color) 100%)",
          zIndex: 1
        }}
      />

      {/* Canvas for Constellation Lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 2, filter: "var(--parallax-filter, none)" }}
      />

      {/* Floating icons (DOM) */}
      <div className="absolute inset-0" style={{ zIndex: 3, filter: "var(--parallax-filter, none)" }}>
        {particles.map((p) => {
          const { Icon, id, baseX, baseY, size, color, opacity } = p;
          return (
            <div
              key={id}
              data-particle-id={id}
              className="absolute"
              style={{
                left: `${baseX}%`,
                top: `${baseY}%`,
                willChange: "transform", // Optimize for continuous transform animation
              }}
            >
              <Icon
                style={{
                  width: size,
                  height: size,
                  color,
                  opacity: `calc(${opacity} * var(--parallax-opacity-multiplier, 1))`,
                  display: "block",
                  filter: `drop-shadow(0 0 ${Math.round(size * 0.3)}px ${color}40)`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
