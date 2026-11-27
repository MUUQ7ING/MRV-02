import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { LyricsPanel } from '../components/LyricsPanel';
import { MeterStrip } from '../components/MeterStrip';
import { ReasonPanel } from '../components/ReasonPanel';
import { TapeScrubber } from '../components/TapeScrubber';
import { SafeImage } from '../components/ui/SafeImage';
import { TactileButton } from '../components/ui/TactileButton';
import { useStudioStore } from '../state/useStudioStore';
import { releaseMeterGraph } from '../utils/audioMeter';
import { coverSrc, fmtSec } from '../utils/time';

export function MonitorTrimView() {
  const {
    activeIdx,
    activeSong,
    activeClips,
    activeClipIdx,
    activeMediaUrl,
    trimCurrentSec,
    trimTotalSec,
    videoRef,
    switchTrimClip,
    addTrimClip,
    removeTrimClip,
    onVideoLoaded,
    onVideoTimeUpdate,
    onVideoPlayState,
    setActiveTab,
    downloadSingle,
  } = useStudioStore();

  const initialSplit = (() => {
    const v = parseFloat(localStorage.getItem('mrv_side_split') || '50');
    return Number.isFinite(v) ? Math.max(22, Math.min(78, v)) : 50;
  })();

  const [sideSplitPct, setSideSplitPct] = useState(initialSplit);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const sideStackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !sideStackRef.current) return;
      const rect = sideStackRef.current.getBoundingClientRect();
      if (rect.height <= 0) return;
      const pct = Math.max(22, Math.min(78, ((e.clientY - rect.top) / rect.height) * 100));
      setSideSplitPct(Math.round(pct * 10) / 10);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDraggingSplit(false);
      setSideSplitPct((cur) => {
        localStorage.setItem('mrv_side_split', String(cur));
        return cur;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    return () => {
      releaseMeterGraph(el);
    };
  }, [activeMediaUrl, videoRef]);

  const startSplitDrag = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    draggingRef.current = true;
    setDraggingSplit(true);
  };

  const resetSideSplit = () => {
    setSideSplitPct(50);
    localStorage.setItem('mrv_side_split', '50');
  };

  const sideStackStyle = {
    gridTemplateRows: `calc(${sideSplitPct}% - 5px) 10px calc(${100 - sideSplitPct}% - 5px)`,
  };

  return (
    <div className="deck-body fill-mode">
      <div className="trim-grid">
        <div className="monitor-col">
          <div className="clip-strip">
            {activeClips.map((clip, cIdx) => (
              <button
                key={cIdx}
                type="button"
                data-testid={`clip-pill-${cIdx}`}
                className={cIdx === activeClipIdx ? 'clip-pill active' : 'clip-pill'}
                onClick={() => switchTrimClip(cIdx)}
              >
                <span>CLIP {cIdx + 1}</span>
                <span>
                  {clip.start}–{clip.end}
                </span>
              </button>
            ))}

            <TactileButton
              size="xs"
              data-testid="add-clip-btn"
              onClick={() => addTrimClip()}
            >
              + ADD CLIP
            </TactileButton>

            <TactileButton
              variant="danger"
              size="xs"
              disabled={activeClips.length <= 1}
              data-testid="del-clip-btn"
              onClick={() => removeTrimClip(activeClipIdx)}
            >
              DEL CLIP
            </TactileButton>
          </div>

          <div className="screen-bezel">
            <div className="screen-frame" data-testid="monitor-screen">
              <div className="screen-bar">
                <span>
                  SYS.01 · MONITOR_OUT · CLIP {activeClipIdx + 1}/{activeClips.length}
                </span>
                <span>
                  CUR {fmtSec(trimCurrentSec)} / {fmtSec(trimTotalSec)}
                </span>
              </div>

              <div className="screen-stage">
                {activeMediaUrl ? (
                  <video
                    key={activeMediaUrl}
                    ref={videoRef}
                    data-testid="monitor-video"
                    src={activeMediaUrl}
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={() => onVideoLoaded()}
                    onTimeUpdate={() => onVideoTimeUpdate()}
                    onPlay={() => onVideoPlayState(true)}
                    onPause={() => onVideoPlayState(false)}
                    onEnded={() => onVideoPlayState(false)}
                  />
                ) : (
                  <div className="screen-empty">
                    <SafeImage
                      src={coverSrc(activeSong)}
                      alt={activeSong?.title || ''}
                      className="screen-empty-cover"
                      fallback={null}
                    />
                    <div className="mono">NO VIDEO SIGNAL FOR TRACK {activeIdx + 1}</div>
                    <div className="empty-card-actions">
                      <TactileButton
                        size="sm"
                        onClick={() => setActiveTab('source')}
                      >
                        前往 02 SOURCE MATRIX
                      </TactileButton>
                      <TactileButton
                        variant="accent"
                        size="sm"
                        onClick={() => downloadSingle(activeIdx)}
                      >
                        队列下载 MV
                      </TactileButton>
                    </div>
                  </div>
                )}
              </div>

              <MeterStrip />
            </div>
          </div>

          <TapeScrubber />
        </div>

        <div ref={sideStackRef} className="side-stack" style={sideStackStyle}>
          <LyricsPanel />
          <div
            className={draggingSplit ? 'side-splitter active' : 'side-splitter'}
            data-testid="side-splitter"
            onMouseDown={startSplitDrag}
            onDoubleClick={resetSideSplit}
            title="拖拽调整歌词与文案区高度，双击恢复 50/50"
          />
          <ReasonPanel />
        </div>
      </div>
    </div>
  );
}
