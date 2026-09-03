import { useStoredTimer } from '../hooks/useStoredTimer'
import { TimerDisplay } from '../components/TimerDisplay'
import './View.css'

export function View() {
  const timer = useStoredTimer()

  return (
    <div className="view-page">
      <TimerDisplay
        formattedTime={format(timer.remainingSeconds)}
        status={timer.status}
        title={timer.config.title}
        showMessage={timer.config.showMessage}
      />
    </div>
  )
}

function format(totalSec: number): string {
  const clamped = Math.max(0, totalSec)
  const h = Math.floor(clamped / 3600)
  const m = Math.floor((clamped % 3600) / 60)
  const s = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
