import { useState, useCallback } from 'react'
import { useTimer } from './hooks/useTimer'
import { TimerDisplay } from './components/TimerDisplay'
import { ConfigPanel } from './components/ConfigPanel'
import type { TimerConfig } from './types/timer'
import './App.css'

function App() {
  const timer = useTimer()
  const [activePreset, setActivePreset] = useState<number | null>(null)

  const handlePresetSelect = useCallback(
    (minutes: number) => {
      const seconds = minutes * 60
      timer.setTime(seconds)
      setActivePreset(minutes)
    },
    [timer]
  )

  const handleTimeApply = useCallback(
    (seconds: number) => {
      timer.setTime(seconds)
      setActivePreset(null)
    },
    [timer]
  )

  const handleStart = useCallback(() => {
    if (timer.remainingSeconds > 0) {
      timer.start()
    }
  }, [timer])

  const handleConfigChange = useCallback(
    (partial: Partial<TimerConfig>) => {
      timer.setConfig(partial)
    },
    [timer]
  )

  const handleReset = useCallback(() => {
    timer.reset(timer.totalSeconds)
  }, [timer])

  return (
    <div className="app">
      <main className="app-main">
        <TimerDisplay
          formattedTime={timer.formattedTime}
          status={timer.status}
          title={timer.config.title}
          showMessage={timer.config.showMessage}
        />
      </main>
      <ConfigPanel
        status={timer.status}
        config={timer.config}
        activePreset={activePreset}
        onPresetSelect={handlePresetSelect}
        onTimeApply={handleTimeApply}
        onAddTime={timer.addTime}
        onStart={handleStart}
        onPause={timer.pause}
        onResume={timer.resume}
        onReset={handleReset}
        onConfigChange={handleConfigChange}
      />
    </div>
  )
}

export default App
