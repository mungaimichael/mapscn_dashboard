import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import type { DriverGeoJSON } from "./useMapData";
import { Users, Wifi, Car, Navigation, WifiOff, HelpCircle, BarChart2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type MapSummaryBoxProps = {
  data?: DriverGeoJSON | null;
  className?: string;
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  DRIVER_STATUS_ONLINE: Wifi,
  DRIVER_STATUS_ONTRIP: Car,
  DRIVER_STATUS_ENROUTE: Navigation,
  DRIVER_STATUS_OFFLINE: WifiOff,
  UNASSIGNED: HelpCircle,
};

const STATUS_COLORS: Record<string, string> = {
  DRIVER_STATUS_ONLINE: "text-emerald-700 bg-emerald-500/15 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-400/20 dark:border-emerald-400/30",
  DRIVER_STATUS_ONTRIP: "text-blue-700 bg-blue-500/15 border-blue-500/30 dark:text-blue-400 dark:bg-blue-400/20 dark:border-blue-400/30",
  DRIVER_STATUS_ENROUTE: "text-violet-700 bg-violet-500/15 border-violet-500/30 dark:text-violet-400 dark:bg-violet-400/20 dark:border-violet-400/30",
  DRIVER_STATUS_OFFLINE: "text-zinc-700 bg-zinc-500/15 border-zinc-500/30 dark:text-zinc-400 dark:bg-zinc-400/20 dark:border-zinc-400/30",
  UNASSIGNED: "text-amber-700 bg-amber-500/15 border-amber-500/30 dark:text-amber-400 dark:bg-amber-400/20 dark:border-amber-400/30",
};

function useDraggable(recalculateDeps: any[] = []) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragInfo = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const enforceBounds = useCallback((currentX: number, currentY: number) => {
    const el = elementRef.current;
    if (!el || !el.parentElement) return { x: currentX, y: currentY };
    
    const parent = el.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    
    const initialLeftSpace = 24;
    const initialBottomSpace = 24;
    
    const maxX = parentRect.width - elRect.width - initialLeftSpace;
    const minX = -initialLeftSpace;
    
    const maxY = initialBottomSpace; 
    const minY = -(parentRect.height - elRect.height - initialBottomSpace);
    
    return {
      x: Math.max(minX, Math.min(currentX, maxX)),
      y: Math.max(minY, Math.min(currentY, maxY))
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setIsDragging(true);
    setHasMoved(false);
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  }, [position]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !elementRef.current) return;
    
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setHasMoved(true);
    }
    
    const newX = dragInfo.current.initialX + dx;
    const newY = dragInfo.current.initialY + dy;
    
    setPosition(enforceBounds(newX, newY));
  }, [isDragging, enforceBounds]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      
      // Magnetic Edge Snapping
      if (elementRef.current && elementRef.current.parentElement) {
        const parent = elementRef.current.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const elRect = elementRef.current.getBoundingClientRect();
        
        const snapThreshold = 40;
        const initialLeftSpace = 24;
        const initialBottomSpace = 24;
        
        const maxX = parentRect.width - elRect.width - initialLeftSpace;
        const minX = -initialLeftSpace;
        
        const maxY = initialBottomSpace; 
        const minY = -(parentRect.height - elRect.height - initialBottomSpace);
        
        let finalX = position.x;
        let finalY = position.y;
        
        if (Math.abs(position.x - minX) < snapThreshold) finalX = minX;
        else if (Math.abs(position.x - maxX) < snapThreshold) finalX = maxX;
        
        if (Math.abs(position.y - minY) < snapThreshold) finalY = minY;
        else if (Math.abs(position.y - maxY) < snapThreshold) finalY = maxY;
        
        if (finalX !== position.x || finalY !== position.y) {
          setPosition({ x: finalX, y: finalY });
        }
      }
    }
  }, [isDragging, position]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Recalculate bounds when dependencies change (e.g., component resized)
  useLayoutEffect(() => {
    const newPos = enforceBounds(position.x, position.y);
    if (newPos.x !== position.x || newPos.y !== position.y) {
      setPosition(newPos);
    }
  }, [position.x, position.y, enforceBounds, ...recalculateDeps]);

  return { position, handlePointerDown, isDragging, hasMoved, elementRef };
}

export function MapSummaryBox({ data, className }: MapSummaryBoxProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(() => 
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  
  const { position, handlePointerDown, isDragging, hasMoved, elementRef } = useDraggable([isExpanded]);

  const handleToggle = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!hasMoved) {
      setIsExpanded((prev) => !prev);
    }
  }, [hasMoved]);

  const counts = useMemo(() => {
    const init = {
      TOTAL: 0,
      DRIVER_STATUS_ONLINE: 0,
      DRIVER_STATUS_ONTRIP: 0,
      DRIVER_STATUS_ENROUTE: 0,
      DRIVER_STATUS_OFFLINE: 0,
      UNASSIGNED: 0,
    };
    if (!data?.features) return init;

    return data.features.reduce((acc, f) => {
      acc.TOTAL++;
      const status = f.properties?.status || "UNASSIGNED";
      if (status in acc) {
        acc[status as keyof typeof acc]++;
      } else {
        acc.UNASSIGNED++;
      }
      return acc;
    }, init);
  }, [data]);

  return (
    <div 
      ref={elementRef}
      className={cn("absolute bottom-6 left-6 z-30 flex flex-col gap-2 pointer-events-none transition-transform", className)}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        // Disable transition while dragging for instant feedback, animate the snap when released
        transitionDuration: isDragging ? '0s' : '300ms',
        transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl pointer-events-auto flex items-center justify-center size-12 rounded-full hover:bg-background",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onPointerDown={handlePointerDown}
            onClick={handleToggle}
          >
            <BarChart2 className="size-5 text-foreground/80" />
          </motion.button>
        ) : (
          <motion.div 
            key="card"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "bg-background/70 backdrop-blur-xl border border-border/50 p-2.5 rounded-lg shadow-xl pointer-events-auto w-fit select-none origin-bottom-left",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onPointerDown={handlePointerDown}
            onClick={handleToggle}
          >
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h3 className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3" />
                {t("dashboard.fleet_overview", "Fleet Overview")}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-foreground/5 px-2 py-0.5 rounded text-[10px] font-semibold text-foreground/80 border border-border/50">
                  <span>{t("dashboard.total", "TOTAL")}</span>
                  <span className="tabular-nums font-semibold text-foreground">{counts.TOTAL}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="p-1 rounded-md hover:bg-foreground/10 transition-colors cursor-pointer text-foreground/60 hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries({
                 DRIVER_STATUS_ONLINE: "Online",
                 DRIVER_STATUS_ONTRIP: "On Trip",
                 DRIVER_STATUS_ENROUTE: "En Route",
                 DRIVER_STATUS_OFFLINE: "Offline",
                 UNASSIGNED: "Unassigned",
              }).map(([key, defaultLabel]) => {
                const Icon = STATUS_ICONS[key] || HelpCircle;
                const style = STATUS_COLORS[key];
                const count = counts[key as keyof typeof counts];
                const label = t(`status.${key.replace("DRIVER_STATUS_", "").toLowerCase()}`, defaultLabel);
                
                return (
                  <div key={key} className={cn("flex items-center justify-between gap-4 px-2 py-1.5 rounded-[6px] border", style)}>
                     <div className="flex items-center gap-1.5">
                       <Icon className="size-3 shrink-0 opacity-80" />
                       <span className="text-[9px] uppercase font-bold tracking-wider opacity-90 truncate leading-none mt-px">{label}</span>
                     </div>
                     <span className="text-[13px] font-semibold tabular-nums leading-none">{count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
