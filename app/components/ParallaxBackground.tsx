"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileImage, Scissors, RotateCw, Lock, QrCode, Code, Palette,
  Wrench, Layers, Download, Sparkles, Minimize2, Droplets, Clock,
  Binary, ShieldCheck, KeyRound, Crop, FileText, Hash, Fingerprint,
  Paintbrush, ImageMinus, Globe, Circle, Plus, Square,
  Terminal, Cpu, Zap, Star, HardDrive, Compass, Eye, Braces, FileCode, ScanLine
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

// Initial raw data across the full page height with rich density in the bottom area.
const RAW_PARTICLES = [
  // --- TOP REGION (y: 5 - 35) ---
  { Icon: FileImage,   x: 4,   y: 8,   size: 34, speed: 0.04, color: "#60A5FA", rotate: -15, opacity: 0.08 },
  { Icon: Circle,      x: 12,  y: 18,  size: 14, speed: 0.02, color: "#60A5FA", rotate: 0,   opacity: 0.10 },
  { Icon: Scissors,    x: 92,  y: 5,   size: 26, speed: 0.09, color: "#34D399", rotate: 20,  opacity: 0.07 },
  { Icon: Plus,        x: 85,  y: 12,  size: 16, speed: 0.03, color: "#34D399", rotate: 45,  opacity: 0.10 },
  { Icon: RotateCw,    x: 15,  y: 28,  size: 24, speed: 0.13, color: "#34D399", rotate: 0,   opacity: 0.09 },
  { Icon: Lock,        x: 83,  y: 27,  size: 26, speed: 0.06, color: "#A78BFA", rotate: -10, opacity: 0.08 },
  { Icon: Circle,      x: 75,  y: 35,  size: 10, speed: 0.05, color: "#A78BFA", rotate: 0,   opacity: 0.08 },
  { Icon: Palette,     x: 48,  y: 6,   size: 30, speed: 0.08, color: "#F472B6", rotate: 15,  opacity: 0.07 },
  { Icon: Download,    x: 38,  y: 18,  size: 26, speed: 0.09, color: "#F472B6", rotate: -8,  opacity: 0.08 },
  { Icon: Sparkles,    x: 64,  y: 13,  size: 28, speed: 0.11, color: "#A78BFA", rotate: 25,  opacity: 0.09 },
  { Icon: Fingerprint, x: 33,  y: 15,  size: 26, speed: 0.09, color: "#22D3EE", rotate: 5,   opacity: 0.07 },
  { Icon: Globe,       x: 78,  y: 18,  size: 28, speed: 0.07, color: "#60A5FA", rotate: 0,   opacity: 0.07 },
  { Icon: Square,      x: 25,  y: 35,  size: 16, speed: 0.05, color: "#FBBF24", rotate: 45,  opacity: 0.08 },

  // --- MID REGION (y: 36 - 69) ---
  { Icon: ImageMinus,  x: 12,  y: 38,  size: 24, speed: 0.10, color: "#FBBF24", rotate: 15,  opacity: 0.08 },
  { Icon: FileText,    x: 62,  y: 38,  size: 30, speed: 0.05, color: "#60A5FA", rotate: 12,  opacity: 0.07 },
  { Icon: KeyRound,    x: 44,  y: 42,  size: 22, speed: 0.15, color: "#FBBF24", rotate: 30,  opacity: 0.06 },
  { Icon: Hash,        x: 89,  y: 42,  size: 24, speed: 0.11, color: "#FBBF24", rotate: -20, opacity: 0.08 },
  { Icon: Crop,        x: 18,  y: 48,  size: 26, speed: 0.08, color: "#A78BFA", rotate: -8,  opacity: 0.08 },
  { Icon: Code,        x: 95,  y: 48,  size: 28, speed: 0.05, color: "#60A5FA", rotate: -5,  opacity: 0.07 },
  { Icon: QrCode,      x: 4,   y: 52,  size: 36, speed: 0.10, color: "#22D3EE", rotate: 5,   opacity: 0.06 },
  { Icon: Paintbrush,  x: 57,  y: 55,  size: 22, speed: 0.14, color: "#F472B6", rotate: -25, opacity: 0.06 },
  { Icon: Plus,        x: 90,  y: 60,  size: 20, speed: 0.04, color: "#60A5FA", rotate: 0,   opacity: 0.10 },
  { Icon: Layers,      x: 76,  y: 62,  size: 32, speed: 0.06, color: "#34D399", rotate: 10,  opacity: 0.07 },
  { Icon: Wrench,      x: 22,  y: 68,  size: 24, speed: 0.12, color: "#22D3EE", rotate: -20, opacity: 0.08 },

  // --- LOWER REGION (y: 70 - 98) ---
  { Icon: Terminal,    x: 5,   y: 72,  size: 26, speed: 0.02, color: "#34D399", rotate: -10, opacity: 0.08 },
  { Icon: Clock,       x: 54,  y: 72,  size: 26, speed: 0.10, color: "#22D3EE", rotate: -5,  opacity: 0.08 },
  { Icon: KeyRound,    x: 82,  y: 74,  size: 24, speed: 0.02, color: "#FBBF24", rotate: -25, opacity: 0.08 },
  { Icon: Square,      x: 30,  y: 75,  size: 12, speed: 0.06, color: "#22D3EE", rotate: 15,  opacity: 0.09 },
  { Icon: Layers,      x: 64,  y: 76,  size: 26, speed: 0.02, color: "#34D399", rotate: 12,  opacity: 0.08 },
  { Icon: Droplets,    x: 86,  y: 78,  size: 30, speed: 0.05, color: "#A78BFA", rotate: 8,   opacity: 0.07 },
  { Icon: Compass,     x: 34,  y: 78,  size: 24, speed: 0.02, color: "#22D3EE", rotate: 25,  opacity: 0.08 },
  { Icon: Circle,      x: 93,  y: 80,  size: 14, speed: 0.01, color: "#22D3EE", rotate: 0,   opacity: 0.10 },
  { Icon: Minimize2,   x: 8,   y: 82,  size: 22, speed: 0.07, color: "#FBBF24", rotate: -12, opacity: 0.07 },
  { Icon: Zap,         x: 15,  y: 82,  size: 24, speed: 0.02, color: "#FBBF24", rotate: 15,  opacity: 0.09 },
  { Icon: Star,        x: 70,  y: 82,  size: 16, speed: 0.01, color: "#F472B6", rotate: 20,  opacity: 0.10 },
  { Icon: Plus,        x: 42,  y: 84,  size: 18, speed: 0.01, color: "#FBBF24", rotate: 0,   opacity: 0.10 },
  { Icon: Circle,      x: 92,  y: 85,  size: 18, speed: 0.03, color: "#A78BFA", rotate: 0,   opacity: 0.08 },
  { Icon: ShieldCheck, x: 72,  y: 86,  size: 28, speed: 0.06, color: "#22D3EE", rotate: -15, opacity: 0.07 },
  { Icon: Binary,      x: 28,  y: 88,  size: 24, speed: 0.13, color: "#60A5FA", rotate: 18,  opacity: 0.07 },
  { Icon: Plus,        x: 8,   y: 88,  size: 16, speed: 0.01, color: "#34D399", rotate: 45,  opacity: 0.10 },
  { Icon: ScanLine,    x: 50,  y: 88,  size: 26, speed: 0.02, color: "#F472B6", rotate: -12, opacity: 0.08 },
  { Icon: Terminal,    x: 88,  y: 88,  size: 28, speed: 0.02, color: "#34D399", rotate: 10,  opacity: 0.08 },
  { Icon: ShieldCheck, x: 58,  y: 90,  size: 26, speed: 0.02, color: "#22D3EE", rotate: -15, opacity: 0.08 },
  { Icon: Plus,        x: 60,  y: 92,  size: 14, speed: 0.04, color: "#22D3EE", rotate: 45,  opacity: 0.09 },
  { Icon: FileCode,    x: 18,  y: 92,  size: 28, speed: 0.01, color: "#60A5FA", rotate: -5,  opacity: 0.08 },
  { Icon: Circle,      x: 38,  y: 94,  size: 14, speed: 0.01, color: "#A78BFA", rotate: 0,   opacity: 0.09 },
  { Icon: Plus,        x: 80,  y: 94,  size: 18, speed: 0.01, color: "#A78BFA", rotate: 0,   opacity: 0.10 },
  { Icon: Square,      x: 66,  y: 95,  size: 12, speed: 0.01, color: "#60A5FA", rotate: 45,  opacity: 0.09 },
  { Icon: Circle,      x: 6,   y: 96,  size: 14, speed: 0.01, color: "#60A5FA", rotate: 0,   opacity: 0.10 },

  // --- EXTENDED DEEP BOTTOM (y: 100 - 150) ---
  { Icon: FileText,    x: 92,  y: 100, size: 26, speed: 0.04, color: "#60A5FA", rotate: -18, opacity: 0.08 },
  { Icon: Zap,         x: 74,  y: 102, size: 24, speed: 0.05, color: "#FBBF24", rotate: -10, opacity: 0.09 },
  { Icon: Sparkles,    x: 46,  y: 105, size: 28, speed: 0.06, color: "#A78BFA", rotate: 18,  opacity: 0.09 },
  { Icon: Cpu,         x: 12,  y: 110, size: 26, speed: 0.06, color: "#22D3EE", rotate: 20,  opacity: 0.08 },
  { Icon: Cpu,         x: 84,  y: 112, size: 24, speed: 0.06, color: "#22D3EE", rotate: 12,  opacity: 0.08 },
  { Icon: Palette,     x: 62,  y: 115, size: 26, speed: 0.06, color: "#F472B6", rotate: 25,  opacity: 0.08 },
  { Icon: Eye,         x: 28,  y: 118, size: 22, speed: 0.07, color: "#60A5FA", rotate: -8,  opacity: 0.07 },
  { Icon: Braces,      x: 20,  y: 120, size: 24, speed: 0.07, color: "#A78BFA", rotate: -15, opacity: 0.08 },
  { Icon: Star,        x: 94,  y: 122, size: 20, speed: 0.05, color: "#FBBF24", rotate: -15, opacity: 0.09 },
  { Icon: Plus,        x: 68,  y: 125, size: 16, speed: 0.04, color: "#34D399", rotate: 45,  opacity: 0.10 },
  { Icon: Star,        x: 40,  y: 128, size: 20, speed: 0.05, color: "#FBBF24", rotate: 15,  opacity: 0.09 },
  { Icon: Square,      x: 8,   y: 130, size: 14, speed: 0.05, color: "#F472B6", rotate: 30,  opacity: 0.09 },
  { Icon: Braces,      x: 80,  y: 132, size: 26, speed: 0.07, color: "#A78BFA", rotate: 8,   opacity: 0.08 },
  { Icon: Binary,      x: 58,  y: 138, size: 24, speed: 0.07, color: "#60A5FA", rotate: 15,  opacity: 0.08 },
  { Icon: Code,        x: 46,  y: 140, size: 28, speed: 0.08, color: "#22D3EE", rotate: -10, opacity: 0.08 },
  { Icon: Circle,      x: 90,  y: 142, size: 16, speed: 0.06, color: "#34D399", rotate: 0,   opacity: 0.09 },
  { Icon: HardDrive,   x: 16,  y: 145, size: 26, speed: 0.08, color: "#34D399", rotate: 10,  opacity: 0.08 },
];

export default function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize particles synchronously with randomized float properties
  const [particles] = useState<Particle[]>(() =>
    RAW_PARTICLES.map((p, i) => ({
      id: i,
      Icon: p.Icon,
      baseX: p.x,
      baseY: p.y,
      size: p.size,
      scrollSpeed: p.speed,
      color: p.color,
      rotate: p.rotate,
      opacity: p.opacity,
      floatAmpX: rand(10, 30),
      floatAmpY: rand(10, 30),
      floatFreqX: rand(0.0005, 0.0015),
      floatFreqY: rand(0.0005, 0.0015),
      phaseX: rand(0, Math.PI * 2),
      phaseY: rand(0, Math.PI * 2),
      currentX: 0,
      currentY: 0,
    }))
  );

  const pRef = useRef<Particle[]>(particles);

  useEffect(() => {
    pRef.current = particles;
  }, [particles]);

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
        el.style.transform = `translate(${idleX}px, ${-scrollOffset + idleY}px) rotate(${p.rotate}deg)`;
      });

      // 2. Draw Constellation Lines
      ctx.lineWidth = 1;
      for (let i = 0; i < pRef.current.length; i++) {
        for (let j = i + 1; j < pRef.current.length; j++) {
          const p1 = pRef.current[i];
          const p2 = pRef.current[j];

          const dx = p1.currentX - p2.currentX;
          const dy = p1.currentY - p2.currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * maxLineAlpha;

            ctx.beginPath();
            ctx.moveTo(p1.currentX + p1.size / 2, p1.currentY + p1.size / 2);
            ctx.lineTo(p2.currentX + p2.size / 2, p2.currentY + p2.size / 2);

            const grad = ctx.createLinearGradient(p1.currentX, p1.currentY, p2.currentX, p2.currentY);
            grad.addColorStop(0, p1.color + Math.round(alpha * 255).toString(16).padStart(2, "0"));
            grad.addColorStop(1, p2.color + Math.round(alpha * 255).toString(16).padStart(2, "0"));

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
  }, [particles]);

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
          zIndex: 1,
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
                willChange: "transform",
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
