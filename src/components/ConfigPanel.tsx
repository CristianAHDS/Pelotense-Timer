import type { TimerStatus, TimerConfig, FinishAction } from '../types/timer';
import { PresetButtons } from './PresetButtons';
import { TimeInput } from './TimeInput';
import { AddTimeInput } from './AddTimeInput';
import './ConfigPanel.css';

interface ConfigPanelProps {
  status: TimerStatus;
  config: TimerConfig;
  activePreset: number | null;
  onPresetSelect: (minutes: number) => void;
  onTimeApply: (seconds: number) => void;
  onAddTime: (seconds: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onConfigChange: (partial: Partial<TimerConfig>) => void;
}

export function ConfigPanel({
  status,
  config,
  activePreset,
  onPresetSelect,
  onTimeApply,
  onAddTime,
  onStart,
  onPause,
  onResume,
  onReset,
  onConfigChange,
}: ConfigPanelProps) {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const isFinished = status === 'finished';
  const isBusy = isRunning || isPaused;
  const canStart = !isBusy && (isIdle || isFinished);

  return (
    <aside className="config-panel">
      <div className="config-panel-header">
        <h2 className="config-panel-title">Configuracoes</h2>
      </div>

      <div className="config-panel-body">
        {isBusy && (
          <div className="config-running-banner">
            <span className="config-running-dot" />
            Temporizador em execução
          </div>
        )}

        {isBusy && (
          <div className="config-section">
            <span className="config-section-title">Adicionar tempo</span>
            <AddTimeInput onAdd={onAddTime} />
          </div>
        )}

        <div className="config-section">
          <PresetButtons
            activePreset={activePreset}
            disabled={isBusy}
            onSelect={onPresetSelect}
          />
          <TimeInput disabled={isBusy} onApply={onTimeApply} />
        </div>

        <div className="config-section">
          <span className="config-section-title">Ao chegar em zero</span>
          <div className="config-radio-group">
            {(['stop', 'restart', 'continue'] as FinishAction[]).map(
              (action) => {
                const labels: Record<FinishAction, string> = {
                  stop: 'Parar',
                  restart: 'Reiniciar',
                  continue: 'Continuar contando',
                };
                return (
                  <label key={action} className="config-radio-item">
                    <input
                      type="radio"
                      name="finishAction"
                      value={action}
                      checked={config.finishAction === action}
                      onChange={() => onConfigChange({ finishAction: action })}
                    />
                    <span className="config-radio-label">{labels[action]}</span>
                  </label>
                );
              },
            )}
          </div>
        </div>
      </div>

      <div className="config-panel-footer">
        {canStart && (
          <button
            className="config-btn config-btn-start"
            onClick={onStart}
            type="button"
          >
            Iniciar
          </button>
        )}

        {isRunning && (
          <button
            className="config-btn config-btn-pause"
            onClick={onPause}
            type="button"
          >
            Pausar
          </button>
        )}

        {isPaused && (
          <>
            <button
              className="config-btn config-btn-reset"
              onClick={onReset}
              type="button"
            >
              Parar
            </button>
            <button
              className="config-btn config-btn-resume"
              onClick={onResume}
              type="button"
            >
              Retomar
            </button>
          </>
        )}

        {isFinished && (
          <button
            className="config-btn config-btn-reset"
            onClick={onReset}
            type="button"
          >
            Resetar
          </button>
        )}
      </div>
    </aside>
  );
}
