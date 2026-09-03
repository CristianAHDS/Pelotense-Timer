import { useState, useRef } from 'react'
import './AddTimeInput.css'

interface AddTimeInputProps {
  onAdd: (seconds: number) => void
}

interface AddFields {
  minutes: string
  seconds: string
}

function clampField(value: string, max: number): string {
  const num = parseInt(value, 10)
  if (isNaN(num)) return '00'
  if (num < 0) return '00'
  if (num > max) return String(max).padStart(2, '0')
  return String(num).padStart(2, '0')
}

export function AddTimeInput({ onAdd }: AddTimeInputProps) {
  const [fields, setFields] = useState<AddFields>({ minutes: '00', seconds: '00' })
  const [error, setError] = useState('')

  const minutesRef = useRef<HTMLInputElement>(null)
  const secondsRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: keyof AddFields, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '')
    setFields((prev) => ({ ...prev, [field]: sanitized }))
    setError('')
  }

  const handleBlur = (field: keyof AddFields) => {
    const max = field === 'minutes' ? 99 : 59
    setFields((prev) => ({ ...prev, [field]: clampField(prev[field], max) }))
  }

  const handleKeyDown = (
    field: keyof AddFields,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === ':' || e.key === 'Tab') {
      e.preventDefault()
      if (field === 'minutes') secondsRef.current?.focus()
      else secondsRef.current?.blur()
    }
    if (e.key === 'Enter') {
      handleApply()
    }
  }

  const handleApply = () => {
    const m = parseInt(fields.minutes, 10) || 0
    const s = parseInt(fields.seconds, 10) || 0

    if (m < 0 || s < 0) {
      setError('Valores negativos nao sao permitidos.')
      return
    }
    if (s > 59) {
      setError('Segundos devem ser entre 0 e 59.')
      return
    }
    if (m + s === 0) {
      setError('Defina um tempo maior que zero.')
      return
    }
    setError('')
    onAdd(m * 60 + s)
    setFields({ minutes: '00', seconds: '00' })
  }

  return (
    <div className="addtime-section">
      <div className="addtime-row">
        <div className="addtime-field">
          <input
            ref={minutesRef}
            type="text"
            inputMode="numeric"
            className={`addtime-field-input ${error ? 'error' : ''}`}
            value={fields.minutes}
            onChange={(e) => handleChange('minutes', e.target.value)}
            onBlur={() => handleBlur('minutes')}
            onKeyDown={(e) => handleKeyDown('minutes', e)}
            maxLength={2}
            aria-label="Minutos"
          />
          <span className="addtime-field-label">Min</span>
        </div>
        <span className="addtime-separator">:</span>
        <div className="addtime-field">
          <input
            ref={secondsRef}
            type="text"
            inputMode="numeric"
            className={`addtime-field-input ${error ? 'error' : ''}`}
            value={fields.seconds}
            onChange={(e) => handleChange('seconds', e.target.value)}
            onBlur={() => handleBlur('seconds')}
            onKeyDown={(e) => handleKeyDown('seconds', e)}
            maxLength={2}
            aria-label="Segundos"
          />
          <span className="addtime-field-label">Seg</span>
        </div>
      </div>
      <span className="addtime-error">{error}</span>
      <button className="addtime-confirm-btn" onClick={handleApply} type="button">
        Adicionar
      </button>
    </div>
  )
}
