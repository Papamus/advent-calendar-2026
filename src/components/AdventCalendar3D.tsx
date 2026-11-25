"use client";

import dynamic from "next/dynamic";
import { LockKeyhole, Sparkles } from "lucide-react";
import { Component, useEffect, useRef, useState } from "react";
import type {
  ErrorInfo,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { motion } from "framer-motion";
import type {
  CalendarDayListResponse,
  CalendarDayStatus,
} from "@/types/calendar";

const AdventCalendarScene = dynamic(
  () => import("@/components/AdventCalendarScene"),
  { ssr: false },
);

interface AdventCalendar3DProps {
  days: CalendarDayListResponse;
  openingDay: number | null;
  onOpenDay: (dayNumber: number) => void | Promise<void>;
}

interface PointerPosition {
  x: number;
  y: number;
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("The 3D calendar scene failed to render.", error, info);
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) {
      return false;
    }

    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function statusLabel(status: CalendarDayStatus): string {
  switch (status) {
    case "ready":
      return "dostępne do otwarcia";
    case "opened":
      return "otwarte";
    default:
      return "zamknięte";
  }
}

export function AdventCalendar3D({
  days,
  openingDay,
  onOpenDay,
}: AdventCalendar3DProps) {
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [shakingDay, setShakingDay] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const pointerRef = useRef<PointerPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setWebglAvailable(supportsWebGL());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    };
  }

  function handlePointerLeave() {
    pointerRef.current = { x: 0, y: 0 };
  }

  function handleDayClick(dayNumber: number) {
    const day = days.find((item) => item.dayNumber === dayNumber);
    if (!day || openingDay !== null) {
      return;
    }

    if (day.status === "locked") {
      setShakingDay(dayNumber);
      setAnnouncement(
        `Okienko ${dayNumber} otworzy się dopiero w swoim dniu grudnia.`,
      );
      window.setTimeout(() => setShakingDay(null), 520);
      return;
    }

    setAnnouncement("");
    void onOpenDay(dayNumber);
  }

  const showScene = webglAvailable && !sceneFailed;

  return (
    <div
      className={`calendar-stage${showScene ? " calendar-stage--3d" : " calendar-stage--fallback"}`}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      <div className="calendar-fallback-cabinet" aria-hidden="true">
        <div className="fallback-roof" />
        <div className="fallback-body" />
      </div>
      {showScene ? (
        <SceneErrorBoundary onError={() => setSceneFailed(true)}>
          <AdventCalendarScene days={days} pointerRef={pointerRef} />
        </SceneErrorBoundary>
      ) : null}
      <div
        className="calendar-day-grid"
        role="group"
        aria-label="Wybierz okienko adwentowe"
      >
        {days.map((day) => {
          const isShaking = shakingDay === day.dayNumber;
          const isOpening = openingDay === day.dayNumber;

          return (
            <motion.button
              animate={
                isShaking
                  ? { x: [0, -6, 6, -4, 4, 0] }
                    : { x: 0 }
              }
              aria-label={`Dzień ${day.dayNumber}, ${statusLabel(day.status)}`}
              className={`calendar-window-button calendar-window-button--${day.status}`}
              data-day-status={day.status}
              data-testid="calendar-day"
              data-calendar-day={day.dayNumber}
              disabled={openingDay !== null}
              key={day.dayNumber}
              onClick={() => handleDayClick(day.dayNumber)}
              transition={
                isShaking
                  ? { duration: 0.42 }
                  : { duration: 0.2 }
              }
              type="button"
            >
              <span className="calendar-window-number">
                {day.dayNumber.toString().padStart(2, "0")}
              </span>
              {day.status === "locked" ? (
                <LockKeyhole
                  aria-hidden="true"
                  className="calendar-window-icon"
                  size={13}
                />
              ) : day.status === "ready" ? (
                <Sparkles
                  aria-hidden="true"
                  className="calendar-window-icon"
                  size={13}
                />
              ) : null}
              {isOpening ? (
                <span className="sr-only">Otwieranie okienka</span>
              ) : null}
            </motion.button>
          );
        })}
      </div>
      <p className="calendar-announcement" aria-live="polite" role="status">
        {announcement || "\u00a0"}
      </p>
    </div>
  );
}
