"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Play, Pause, RotateCcw, Check } from "lucide-react";
import type { AudioMimeType } from "@/types";
import { useRecorder, MIN_DURATION_SECONDS } from "./use-recorder";
import { AuraRings } from "./AuraRings";
import { PetalWaveform } from "./PetalWaveform";
import { UploadProgressRing } from "./UploadProgressRing";

export interface RecordingValue {
  blob: Blob;
  mimeType: AudioMimeType;
  seconds: number;
}

interface AudioRecorderProps {
  onChange: (value: RecordingValue | null) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

const CANCEL_THRESHOLD = 80;
const LOCK_THRESHOLD = 80;

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioRecorder({
  onChange,
  isUploading = false,
  uploadProgress = 0,
}: AudioRecorderProps) {
  const rec = useRecorder();
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showCancelHint, setShowCancelHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Lift completed recording up to the form (and clear on reset).
  useEffect(() => {
    if (rec.status === "completed" && rec.audioBlob && rec.mimeType) {
      onChange({
        blob: rec.audioBlob,
        mimeType: rec.mimeType,
        seconds: rec.seconds,
      });
    }
    if (rec.status === "idle") onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.status]);

  // Clear the "too short" nudge after a moment.
  useEffect(() => {
    if (!rec.tooShort) return;
    const t = setTimeout(rec.clearTooShort, 1800);
    return () => clearTimeout(t);
  }, [rec.tooShort, rec.clearTooShort]);

  const beginHold = useCallback(
    (x: number, y: number) => {
      startPos.current = { x, y };
      setLocked(false);
      setShowCancelHint(false);
      void rec.start();
    },
    [rec],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (rec.status !== "idle") return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    beginHold(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (rec.status !== "recording" || !startPos.current || locked) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (dy <= -LOCK_THRESHOLD) {
      setLocked(true);
      setShowCancelHint(false);
      return;
    }
    setShowCancelHint(dx <= -40);
    if (dx <= -CANCEL_THRESHOLD) {
      rec.cancel();
      startPos.current = null;
    }
  };

  const handlePointerUp = () => {
    if (rec.status !== "recording") return;
    if (locked) return; // locked recordings keep going until Stop is pressed
    rec.stop();
    startPos.current = null;
  };

  // Keyboard: hold Space to record, release to stop (design.md §11).
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== " " && e.key !== "Enter") return;
    if (e.repeat) return;
    e.preventDefault();
    if (rec.status === "idle") beginHold(0, 0);
  };
  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key !== " " && e.key !== "Enter") return;
    if (rec.status === "recording" && !locked) rec.stop();
  };

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const isRecording = rec.status === "recording";
  const isCompleted = rec.status === "completed";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Live timer / status announced to screen readers */}
      <span className="sr-only" aria-live="polite">
        {isRecording
          ? `Recording, ${formatTime(rec.seconds)}`
          : isCompleted
            ? `Recording ready, ${formatTime(rec.seconds)}`
            : ""}
      </span>

      {isRecording && <PetalWaveform amplitudes={rec.amplitudes} />}

      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        {isRecording && <AuraRings />}
        {isUploading && <UploadProgressRing progress={uploadProgress} />}

        {!isCompleted && (
          <motion.button
            type="button"
            aria-label={
              isRecording ? "Stop recording" : "Hold to record your chanting"
            }
            disabled={isUploading}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            animate={
              rec.tooShort
                ? { x: [0, -6, 6, -4, 4, 0] }
                : isRecording
                  ? { scale: [1, 1.08, 1] }
                  : { scale: 1 }
            }
            transition={
              isRecording
                ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.4 }
            }
            className="relative z-10 flex h-[72px] w-[72px] touch-none select-none items-center justify-center rounded-full text-white shadow-glow"
            style={{
              background: isRecording
                ? "radial-gradient(circle at 50% 40%, var(--color-error), #9a1f1f)"
                : "radial-gradient(circle at 50% 40%, var(--color-primary), var(--color-primary-dark))",
            }}
          >
            <Mic size={24} aria-hidden="true" />
          </motion.button>
        )}

        {isCompleted && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause playback" : "Play recording"}
            className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-full text-white shadow-glow"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, #be185d, #7c3aed)",
            }}
          >
            {isPlaying ? (
              <Pause size={24} aria-hidden="true" />
            ) : (
              <Play size={24} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Idle / recording helper text */}
      {rec.status === "idle" && (
        <p className="font-body text-body-sm text-muted">
          {rec.tooShort
            ? `Hold a little longer — at least ${MIN_DURATION_SECONDS}s.`
            : "Hold and speak your chanting into this space."}
        </p>
      )}
      {isRecording && (
        <div className="flex flex-col items-center gap-1">
          <span className="font-body text-body-sm tabular-nums text-foreground">
            {formatTime(rec.seconds)}
          </span>
          {locked ? (
            <button
              type="button"
              onClick={rec.stop}
              className="btn-secondary h-9 px-5 text-body-sm"
            >
              Stop
            </button>
          ) : (
            <span
              className="text-caption text-muted transition-opacity"
              style={{ opacity: showCancelHint ? 1 : 0.5 }}
            >
              ‹ Slide to cancel · slide up to lock
            </span>
          )}
        </div>
      )}

      {/* Completed controls */}
      {isCompleted && (
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-pill bg-secondary-light px-3 py-1 text-caption text-heading">
            <Check size={14} aria-hidden="true" />
            {formatTime(rec.seconds)} recorded
          </span>
          <audio
            ref={audioElRef}
            src={rec.audioUrl ?? undefined}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={rec.reset}
              className="btn-secondary h-10 gap-2 px-5 text-body-sm"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Re-record
            </button>
          </div>
        </div>
      )}

      {rec.error && (
        <p role="alert" className="text-caption text-error">
          {rec.error}
        </p>
      )}
    </div>
  );
}
