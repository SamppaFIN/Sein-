import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Planet {
  x: number;
  y: number;
  radius: number;
  color: string;
  ringColor?: string;
  hasRing: boolean;
  orbitSpeed: number;
  orbitRadius: number;
  angle: number;
}

interface Galaxy {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  arms: number;
  opacity: number;
}

const COLORS = {
  stars: ['#ffffff', '#ffe9c4', '#c9e4ff', '#ffd4d4', '#e8e8ff'],
  planets: ['#e8a87c', '#6ab7ff', '#ff6b8a', '#7ec8a0', '#c4a6ff', '#ffd93d', '#ff8c5a'],
  galaxies: ['rgba(180,160,255,0.15)', 'rgba(140,200,255,0.12)', 'rgba(255,160,200,0.10)', 'rgba(160,255,200,0.10)'],
};

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    stars: Star[];
    planets: Planet[];
    galaxies: Galaxy[];
    time: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Alusta tila
    const init = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;

      // Tähdet (n. 200)
      const stars: Star[] = Array.from({ length: 200 }, () => ({
        x: random(0, w),
        y: random(0, h),
        radius: random(0.5, 2.5),
        opacity: random(0.3, 1),
        twinkleSpeed: random(0.002, 0.008),
        twinkleOffset: random(0, Math.PI * 2),
      }));

      // Planeetat (4-6)
      const planetCount = Math.floor(random(3, 7));
      const planets: Planet[] = Array.from({ length: planetCount }, () => ({
        x: random(0.15 * w, 0.85 * w),
        y: random(0.15 * h, 0.85 * h),
        radius: random(15, 50),
        color: pick(COLORS.planets),
        hasRing: Math.random() > 0.6,
        ringColor: pick(COLORS.planets),
        orbitSpeed: random(0.0001, 0.0005),
        orbitRadius: random(2, 8),
        angle: random(0, Math.PI * 2),
      }));

      // Galaksit (2-3)
      const galaxyCount = Math.floor(random(1, 4));
      const galaxies: Galaxy[] = Array.from({ length: galaxyCount }, () => ({
        x: random(0.1 * w, 0.9 * w),
        y: random(0.1 * h, 0.9 * h),
        radius: random(60, 140),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(0.00005, 0.0003),
        arms: Math.floor(random(2, 5)),
        opacity: random(0.06, 0.15),
      }));

      stateRef.current = { stars, planets, galaxies, time: 0, width: w, height: h };
    };

    init();
    window.addEventListener('resize', init);

    // Animaatio
    let animId: number;

    const drawGalaxy = (galaxy: Galaxy) => {
      if (!ctx) return;
      const { x, y, radius, rotation, arms, opacity } = galaxy;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      for (let arm = 0; arm < arms; arm++) {
        const armAngle = (arm / arms) * Math.PI * 2;
        ctx.save();
        ctx.rotate(armAngle);

        // Spiraalihaara
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, `rgba(200,180,255,${opacity * 2})`);
        gradient.addColorStop(0.4, `rgba(160,140,220,${opacity})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();

        // Piirrä spiraali
        const spiralPoints = 80;
        for (let i = 0; i < spiralPoints; i++) {
          const t = i / spiralPoints;
          const r = t * radius;
          const spiralAngle = t * Math.PI * 3; // 1.5 kierrosta
          const px = Math.cos(spiralAngle) * r;
          const py = Math.sin(spiralAngle) * r;
          const spread = (1 - t) * radius * 0.4 + radius * 0.06;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);

          // Leveämpi alussa, kapeampi lopussa
          if (i % 4 === 0) {
            ctx.save();
            ctx.translate(px, py);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, spread * (1 - t * 0.9), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        ctx.restore();
      }
      ctx.restore();
    };

    const drawPlanet = (planet: Planet) => {
      if (!ctx) return;
      const { x, y, radius, color, hasRing, ringColor, angle, orbitRadius } = planet;

      ctx.save();
      const ox = x + Math.cos(angle) * orbitRadius;
      const oy = y + Math.sin(angle) * orbitRadius;
      ctx.translate(ox, oy);

      // Rengas
      if (hasRing && ringColor) {
        ctx.save();
        ctx.scale(1, 0.3);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 1.8);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Planeetan pinta
      const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(0.7, color);
      grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Pinnan tekstuuri
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(radius * 0.2, -radius * 0.3, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawStar = (star: Star, time: number) => {
      if (!ctx) return;
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
      const alpha = star.opacity * twinkle;

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();

      // Kirkkaille tähdille hehku
      if (star.radius > 1.5 && alpha > 0.7) {
        ctx.fillStyle = `rgba(200,220,255,${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = (timestamp: number) => {
      const state = stateRef.current;
      if (!state || !ctx) {
        animId = requestAnimationFrame(animate);
        return;
      }

      state.time = timestamp;
      const { width, height } = state;

      // Tausta
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, width, height);

      // Galaksit (piirretään ensin, taustalle)
      for (const galaxy of state.galaxies) {
        galaxy.rotation += galaxy.rotationSpeed;
        drawGalaxy(galaxy);
      }

      // Tähdet
      for (const star of state.stars) {
        drawStar(star, timestamp);
      }

      // Planeetat
      for (const planet of state.planets) {
        planet.angle += planet.orbitSpeed;
        drawPlanet(planet);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cosmic-bg-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
