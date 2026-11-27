import { useStudioStore } from '../state/useStudioStore';
import { BatchDrawer } from './BatchDrawer';
import { TactileButton } from './ui/TactileButton';

export function Topbar() {
  const {
    theme,
    toggleTheme,
    playlist,
    setSequenceName,
    saveState,
    dirty,
    isSaving,
    activeView,
    activeTab,
    applyTrimAndSave,
    savePlaylist,
    totalDurationStr,
    status,
    biliUser,
    neteaseAudioCfg,
    showTools,
    setShowTools,
    openingStudio,
    openRemotionStudio,
    renderRemotionVideo,
    cancelRemotionRender,
  } = useStudioStore();

  const songs = playlist.songs || [];
  const height = playlist.resolution?.height || 1080;
  const fps = playlist.fps || 60;

  const chipClasses = ['save-chip'];
  if (dirty || saveState !== 'saved') chipClasses.push('dirty');
  if (saveState === 'error') chipClasses.push('error');

  const ledTone =
    saveState === 'error' ? 'red' : saveState === 'dirty' || dirty ? 'accent' : 'green';
  const chipLabel =
    isSaving
      ? 'SAVING'
      : saveState === 'error'
        ? 'SAVE ERR'
        : saveState === 'dirty' || dirty
          ? 'UNSAVED'
          : 'SAVED';

  const handleChipClick = () => {
    if (activeView === 'song' && activeTab === 'trim') {
      applyTrimAndSave();
    } else {
      savePlaylist({ silent: false });
    }
  };

  const authReady = biliUser.logged_in && neteaseAudioCfg.configured;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-plate" data-testid="brand-plate">
          <span className="brand-dot" />
          <span>MRV-01</span>
        </div>

        <input
          type="text"
          className="seq-input"
          data-testid="seq-name-input"
          aria-label="输出序列名称"
          value={playlist.output_sequence_name || ''}
          onChange={(e) => setSequenceName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.currentTarget as HTMLInputElement).blur();
              savePlaylist({ silent: true });
            }
          }}
          placeholder="输出序列名称"
        />

        <button
          type="button"
          className={chipClasses.join(' ')}
          data-testid="save-chip"
          data-state={saveState}
          onClick={handleChipClick}
          title={saveState === 'error' ? '点击重试保存' : '保存配置 (Cmd/Ctrl+S)'}
        >
          <span className={`te-led ${ledTone}`} />
          <span>{chipLabel}</span>
        </button>

        <span className="spec-pill" data-testid="spec-pill">
          {songs.length} TRK · {totalDurationStr} · {height}P/{fps}FPS
        </span>
      </div>

      <div className="topbar-right">
        <TactileButton
          variant="default"
          size="icon"
          data-testid="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'light' ? '切换深色面板' : '切换浅色面板'}
          aria-label="切换主题"
        >
          {theme === 'light' ? '☾' : '☀'}
        </TactileButton>

        <div className="tools-wrap">
          <TactileButton
            variant="default"
            active={showTools}
            led={authReady ? 'green' : 'amber'}
            data-testid="batch-menu-btn"
            onClick={() => setShowTools((prev) => !prev)}
          >
            <span>≡ BATCH</span>
            {status.queue_count > 0 ? <span className="mono">Q:{status.queue_count}</span> : null}
          </TactileButton>
          <BatchDrawer />
        </div>

        <span className="topbar-sep" />

        <TactileButton
          variant="dark"
          data-testid="studio-btn"
          disabled={openingStudio || isSaving}
          onClick={() => openRemotionStudio()}
        >
          ▶ {openingStudio ? 'STARTING' : 'STUDIO'}
        </TactileButton>

        {!status.is_rendering ? (
          <TactileButton
            variant="accent"
            data-testid="export-btn"
            disabled={status.is_downloading || isSaving}
            onClick={() => renderRemotionVideo()}
          >
            EXPORT MP4
          </TactileButton>
        ) : (
          <TactileButton
            variant="danger"
            data-testid="cancel-render-btn"
            onClick={() => cancelRemotionRender()}
          >
            ⏹ STOP
          </TactileButton>
        )}
      </div>
    </header>
  );
}
