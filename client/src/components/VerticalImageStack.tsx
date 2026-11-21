import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface VerticalImageStackItem {
  image: string;
  title: string;
  meta?: string;
}

interface VerticalImageStackProps {
  items: VerticalImageStackItem[];
  label?: string;
}

export default function VerticalImageStack({ items, label = "Image stack" }: VerticalImageStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const dragRef = useRef({ startY: 0, moved: false });

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const delta = event.clientY - dragRef.current.startY;
    if (Math.abs(delta) > 4) dragRef.current.moved = true;
    setDragOffset(delta);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const delta = event.clientY - dragRef.current.startY;
    if (Math.abs(delta) > 56 && items.length > 1) {
      setActiveIndex((current) => (current + (delta < 0 ? 1 : items.length - 1)) % items.length);
    }
    setDragOffset(0);
  };

  const selectCard = (index: number) => {
    if (dragRef.current.moved) return;
    setActiveIndex(index);
  };

  return (
    <div className="vertical-stack" aria-label={label}>
      <div
        className="vertical-stack-stage"
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {items.map((item, index) => {
          const relative = (index - activeIndex + items.length) % items.length;
          const isActive = relative === 0;
          const depth = Math.min(relative, 4);
          const translateY = (depth * 24) + (isActive ? dragOffset : 0);
          const translateX = depth * 13;
          const scale = 1 - depth * 0.045;
          return (
            <div
              key={`${item.title}-${index}`}
              className={`vertical-stack-card${isActive ? " is-active" : ""}`}
              style={{
                zIndex: items.length - depth,
                transform: `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), 0) scale(${scale})`,
                opacity: depth > 3 ? 0 : 1 - depth * 0.08,
              }}
              role="button"
              tabIndex={0}
              aria-label={`${item.title}${item.meta ? `, ${item.meta}` : ""}`}
              onClick={() => selectCard(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectCard(index);
                }
              }}
            >
              <img src={item.image} alt={item.title} draggable={false} />
              <div className="vertical-stack-card-meta">
                <span>{item.title}</span>
                {item.meta && <strong>{item.meta}</strong>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="vertical-stack-hint">Drag to reveal · tap a piece</p>
    </div>
  );
}
