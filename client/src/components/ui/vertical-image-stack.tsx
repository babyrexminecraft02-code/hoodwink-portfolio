import { useState, useCallback, useEffect, useRef } from "react";
import { motion, type PanInfo } from "framer-motion";

export interface VerticalImageStackImage {
  id: string | number;
  src: string;
  alt: string;
  title?: string;
  meta?: string;
}

interface VerticalImageStackProps {
  images: VerticalImageStackImage[];
}

export function VerticalImageStack({ images }: VerticalImageStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastNavigationTime = useRef(0);
  const navigationCooldown = 400;

  const navigate = useCallback((newDirection: number) => {
    const now = Date.now();
    if (now - lastNavigationTime.current < navigationCooldown) return;
    lastNavigationTime.current = now;

    setCurrentIndex((previous) => {
      if (newDirection > 0) return previous === images.length - 1 ? 0 : previous + 1;
      return previous === 0 ? images.length - 1 : previous - 1;
    });
  }, [images.length]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.y < -threshold) navigate(1);
    else if (info.offset.y > threshold) navigate(-1);
  };

  const handleWheel = useCallback((event: WheelEvent) => {
    if (Math.abs(event.deltaY) <= 30) return;
    navigate(event.deltaY > 0 ? 1 : -1);
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const getCardStyle = (index: number) => {
    const total = images.length;
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    if (diff === 0) return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 };
    if (diff === -1) return { y: -160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 };
    if (diff === -2) return { y: -280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 };
    if (diff === 1) return { y: 160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 };
    if (diff === 2) return { y: 280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 };
    return { y: diff > 0 ? 400 : -400, scale: 0.6, opacity: 0, zIndex: 0, rotateX: diff > 0 ? -20 : 20 };
  };

  const isVisible = (index: number) => {
    const total = images.length;
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return Math.abs(diff) <= 2;
  };

  if (!images.length) return null;

  return (
    <div className="relative flex min-h-[680px] w-full items-center justify-center overflow-hidden bg-[#1F1820] text-[#e9e5db] sm:min-h-[720px]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e9e5db]/[0.03] blur-3xl" />
      </div>

      <div className="relative flex h-[540px] w-[320px] items-center justify-center sm:h-[580px] sm:w-[360px]" style={{ perspective: "1200px" }}>
        {images.map((image, index) => {
          if (!isVisible(index)) return null;
          const style = getCardStyle(index);
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={image.id}
              className="vertical-stack-card absolute cursor-grab active:cursor-grabbing"
              animate={{ y: style.y, scale: style.scale, opacity: style.opacity, rotateX: style.rotateX, zIndex: style.zIndex }}
              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
              drag={isCurrent ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ transformStyle: "preserve-3d", zIndex: style.zIndex }}
            >
              <div className="relative h-[420px] w-[280px] overflow-hidden rounded-3xl bg-[#b6ad9c] ring-1 ring-[#e9e5db]/20 sm:h-[460px] sm:w-[308px]" style={{ boxShadow: isCurrent ? "0 25px 50px -12px rgba(0,0,0,.4), 0 0 0 1px rgba(233,229,219,.05)" : "0 10px 30px -10px rgba(0,0,0,.25)" }}>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#e9e5db]/10 via-transparent to-transparent" />
                <img src={image.src} alt={image.alt} className="h-full w-full object-cover" draggable={false} />
                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#1F1820]/80 to-transparent" />
                {(image.title || image.meta) && <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[#e9e5db] sm:text-[11px]">{image.title && <span>{image.title}</span>}{image.meta && <strong className="font-normal text-[#ff2b2b]">{image.meta}</strong>}</div>}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-2 sm:right-8">
        {images.map((image, index) => <button key={image.id} onClick={() => setCurrentIndex(index)} className={`h-2 w-2 rounded-full transition-all duration-300 ${index === currentIndex ? "h-6 bg-[#ff2b2b]" : "bg-[#e9e5db]/30 hover:bg-[#e9e5db]/50"}`} aria-label={`Go to image ${index + 1}`} />)}
      </div>

      <div className="absolute left-5 top-1/2 -translate-y-1/2 sm:left-8">
        <div className="flex flex-col items-center font-mono tabular-nums"><span className="text-3xl font-light text-[#e9e5db] sm:text-4xl">{String(currentIndex + 1).padStart(2, "0")}</span><div className="my-2 h-px w-8 bg-[#e9e5db]/20" /><span className="text-xs text-[#e9e5db]/50 sm:text-sm">{String(images.length).padStart(2, "0")}</span></div>
      </div>

      <motion.div className="absolute bottom-7 left-1/2 -translate-x-1/2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6 }}>
        <div className="flex flex-col items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#e9e5db]/55 sm:text-[10px]"><span>Scroll or drag</span><motion.span animate={{ y: [0, 5, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}>↓</motion.span></div>
      </motion.div>
    </div>
  );
}
