import type { TimerStatus } from '../types/timer';
import './TimerDisplay.css';

interface TimerDisplayProps {
  formattedTime: string;
  status: TimerStatus;
  title?: string;
  showMessage?: boolean;
}

const STATUS_LABELS: Record<TimerStatus, string> = {
  idle: 'Pronto',
  running: 'Em execução',
  paused: 'Pausado',
  finished: 'Finalizado',
};

export function TimerDisplay({
  formattedTime,
  status,
  title,
  showMessage,
}: TimerDisplayProps) {
  return (
    <div className="timer-display">
      <div className="timer-display-logos">
        <img src="/pelotense.png" alt="Pelotense" className="timer-logo" />
        <img src="/ahoradosul.png" alt="A Hora do Sul" className="timer-logo" />
      </div>
      <div className={`timer-display-time ${status}`}>{formattedTime}</div>
      <div className={`timer-display-status ${status}`}>
        <span className="timer-display-status-dot" />
        {STATUS_LABELS[status]}
      </div>
      {showMessage && title && (
        <div className="timer-display-title">{title}</div>
      )}
    </div>
  );
}
