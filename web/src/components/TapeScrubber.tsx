import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { useStudioStore } from '../state/useStudioStore';
import { fmtSec, parseSec } from '../utils/time';
import { TactileButton } from './ui/TactileButton';

export function TapeScrubber() {
  const {
    activeClip,
    trimCurrentSec,
    trimTotalSec,
    isPlaying,
    trimLoopPlaying,
    setTrimLoopPlaying,
    togglePlay,
    seekTo,
    setTrimPoint,
    nudgeTrim,
    setScrubPoint,
  } = useStudioStore();

  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingHandleRef = useRef<'in' | 'out' | null>(null);

  const startSec = parseSec(activeClip?.start);
  const endSec = parseSec(activeClip?.end);
  const total = trimTotalSec > 0 ? trimTotalSec : Math.max(endSec, 1);

  const leftPct = Math.max(0, Math.min(100, (startSec / total) * 100));
  const rightPct = Math.max(leftPct, Math.min(100, (endSec / total) * 100));
  const headPct = Math.max(0, Math.min(100, (trimCurrentSec / total) * 100));
  const clipDur = Math.max(0, endSec - startSec);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const handle = draggingHandleRef.current;
      const track = trackRef.current;
      if (!handle || !track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const sec = Math.round(ratio * total * 10) / 10;
      setScrubPoint(handle, sec);
    };
    const onUp = () => {
      draggingHandleRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setScrubPoint, total]);

  const onTrackClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(ratio * total);
  };

  return (
    <div className="scrubber-box" data-testid="tape-scrubber">
      <div
        ref={trackRef}
        className="scrubber-track"
        onClick={onTrackClick}
      >
        <div className="scrubber-ticks" />
        <div
          className="scrubber-range"
          style={{ left: `${leftPct}%`, width: `${Math.max(0.8, rightPct - leftPct)}%` }}
        />
        <div className="scrubber-head" style={{ left: `${headPct}%` }} />
        <div
          className="scrubber-handle in"
          data-testid="scrubber-handle-in"
          style={{ left: `clamp(6px, ${leftPct}%, calc(100% - 6px))` }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            draggingHandleRef.current = 'in';
          }}
        >
          I
        </div>
        <div
          className="scrubber-handle out"
          data-testid="scrubber-handle-out"
          style={{ left: `clamp(6px, ${rightPct}%, calc(100% - 6px))` }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            draggingHandleRef.current = 'out';
          }}
        >
          O
        </div>
      </div>

      <div className="transport-row">
        <div className="transport-btns">
          <TactileButton
            variant="dark"
            size="sm"
            data-testid="transport-play"
            onClick={() => togglePlay()}
          >
            {isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
          </TactileButton>
          <TactileButton
            size="sm"
            active={trimLoopPlaying}
            led={trimLoopPlaying ? 'accent' : 'off'}
            data-testid="transport-loop"
            onClick={() => setTrimLoopPlaying(!trimLoopPlaying)}
          >
            {trimLoopPlaying ? 'LOOP ON' : 'LOOP OFF'}
          </TactileButton>
          <TactileButton
            size="sm"
            data-testid="transport-jump-in"
            onClick={() => seekTo(startSec)}
          >
            IN ⇥
          </TactileButton>
          <TactileButton
            size="sm"
            data-testid="transport-jump-out"
            onClick={() => seekTo(endSec)}
          >
            ⇤ OUT
          </TactileButton>
        </div>

        <span className="transport-hint">
          DUR {clipDur.toFixed(1)}S · SPACE / I / O / ← →
        </span>
      </div>

      <div className="io-grid">
        <div className="io-box" data-testid="io-in-box">
          <div className="io-top">
            <span className="io-label">IN POINT</span>
            <span className="io-readout">{fmtSec(startSec)}</span>
          </div>
          <div className="io-btns">
            <TactileButton size="xs" onClick={() => nudgeTrim('in', -1)}>
              -1s
            </TactileButton>
            <TactileButton size="xs" onClick={() => nudgeTrim('in', -0.1)}>
              -0.1s
            </TactileButton>
            <TactileButton variant="accent" size="xs" onClick={() => setTrimPoint('in')}>
              SET I
            </TactileButton>
            <TactileButton size="xs" onClick={() => nudgeTrim('in', 0.1)}>
              +0.1s
            </TactileButton>
            <TactileButton size="xs" onClick={() => nudgeTrim('in', 1)}>
              +1s
            </TactileButton>
          </div>
        </div>

        <div className="io-box" data-testid="io-out-box">
          <div className="io-top">
            <span className="io-label">OUT POINT</span>
            <span className="io-readout">{fmtSec(endSec)}</span>
          </div>
          <div className="io-btns">
            <TactileButton size="xs" onClick={() => nudgeTrim('out', -1)}>
              -1s
            </TactileButton>
            <TactileButton size="xs" onClick={() => nudgeTrim('out', -0.1)}>
              -0.1s
            </TactileButton>
            <TactileButton variant="accent" size="xs" onClick={() => setTrimPoint('out')}>
              SET O
            </TactileButton>
            <TactileButton size="xs" onClick={() => nudgeTrim('out', 0.1)}>
              +0.1s
            </TactileButton>
            <TactileButton size="xs" onClick={() => nudgeTrim('out', 1)}>
              +1s
            </TactileButton>
          </div>
        </div>
      </div>
    </div>
  );
}
