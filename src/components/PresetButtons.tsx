import { PRESET_VALUES } from '../types/timer'
import './PresetButtons.css'

interface PresetButtonsProps {
  activePreset: number | null
  disabled: boolean
  onSelect: (minutes: number) => void
}

export function PresetButtons({ activePreset, disabled, onSelect }: PresetButtonsProps) {
  return (
    <div className="preset-section">
      <span className="preset-section-title">Tempos rapidos</span>
      <div className="preset-grid">
        {PRESET_VALUES.map((min) => (
          <button
            key={min}
            className={`preset-btn ${activePreset === min ? 'active' : ''}`}
            onClick={() => onSelect(min)}
            disabled={disabled}
            type="button"
          >
            <span className="preset-btn-label">{min === 0.5 ? '30s' : `${min}m`}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
