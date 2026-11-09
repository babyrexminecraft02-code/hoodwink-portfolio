import { useEffect, useRef, type CSSProperties } from "react";

type DigitalRainProps = {
  headColor?: string;
  trailColor?: string;
  glyphSize?: number;
  speed?: number;
  angle?: number;
  density?: number;
  trail?: number;
  shuffle?: boolean;
  style?: CSSProperties;
};

type Stream = {
  y: number;
  rate: number;
  burnout: number;
  alpha: number;
  chars: string[];
};

type Column = {
  streams: Stream[];
  releaseAt: number;
};

const DEFAULTS = {
  headColor: "#E4E2E8",
  trailColor: "#B8AFC4",
  glyphSize: 12,
  speed: 4,
  density: 48,
  trail: 14,
  glyphs: "HOODWINKHOODWINK",
};

export default function DigitalRain({
  headColor = DEFAULTS.headColor,
  trailColor = DEFAULTS.trailColor,
  glyphSize = DEFAULTS.glyphSize,
  speed = DEFAULTS.speed,
  angle = 0,
  density = DEFAULTS.density,
  trail = DEFAULTS.trail,
  shuffle = true,
  style,
}: DigitalRainProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = Array.from(DEFAULTS.glyphs);
    const tailLength = Math.max(1, Math.round(trail));
    const rate = speed * glyphSize;
    const gap = glyphSize * (1 + (50 - density) / 12);
    let width = 0;
    let height = 0;
    let span = 0;
    let columns: Column[] = [];
    let raf = 0;
    let last = 0;
    let alive = true;

    const pick = () => chars[Math.floor(Math.random() * chars.length)];
    const nextRelease = () => span * (0.3 + Math.random() * 0.5);
    const spawn = (y: number): Stream => ({
      y,
      rate: rate * (0.75 + Math.random() * 0.5),
      burnout: Math.random() < 0.35 ? Infinity : 0.75 + Math.random() * 0.25,
      alpha: 1,
      chars: Array.from({ length: tailLength }, pick),
    });

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = wrap.clientWidth || 360;
      height = wrap.clientHeight || 320;
      span = Math.hypot(width, height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(1, Math.ceil(span / gap));
      columns = Array.from({ length: count }, () => ({
        streams: [spawn(Math.random() * span)],
        releaseAt: nextRelease(),
      }));
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.font = `${glyphSize}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const lead = tailLength * glyphSize;
      columns.forEach((column, index) => {
        const streams = column.streams;
        const x = -span / 2 + index * gap + gap / 2;
        streams.forEach((stream) => {
          if (!reducedMotion) stream.y += stream.rate * dt;
          if (shuffle && !reducedMotion && Math.random() < 0.25) {
            stream.chars[Math.floor(Math.random() * stream.chars.length)] = pick();
          }
          if (stream.burnout !== Infinity && stream.y / span > stream.burnout) {
            stream.alpha -= dt * 1.5;
          }

          for (let j = 0; j < tailLength; j += 1) {
            const y = -span / 2 + stream.y - j * glyphSize;
            if (y < -span / 2 - glyphSize || y > span / 2 + glyphSize) continue;
            ctx.globalAlpha = Math.max(0, stream.alpha) * (j === 0 ? 1 : 1 - j / tailLength);
            ctx.fillStyle = j === 0 ? headColor : trailColor;
            ctx.fillText(stream.chars[j], x, y);
          }
        });

        if (!reducedMotion) {
          column.streams = streams.filter((stream) => stream.alpha > 0 && stream.y - lead <= span);
          const newest = column.streams[column.streams.length - 1];
          if (!newest || newest.y >= column.releaseAt) {
            column.streams.push(spawn(-lead));
            column.releaseAt = nextRelease();
          }
        }
      });

      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const loop = (time: number) => {
      if (!alive) return;
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 1 / 60;
      last = time;
      draw(dt);
      if (!reducedMotion) raf = requestAnimationFrame(loop);
    };

    layout();
    draw(1 / 60);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(layout);
    observer?.observe(wrap);
    if (!reducedMotion) raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [angle, density, glyphSize, headColor, shuffle, speed, trail, trailColor]);

  return (
    <div ref={wrapRef} className="digital-rain" style={style} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
