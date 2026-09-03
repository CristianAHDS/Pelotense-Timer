import { useState, useRef, useEffect } from 'react'
import './TimeInput.css'

interface TimeInputProps {
  disabled: boolean
  onApply: (totalSeconds: number) => void
}

interface TimeFields {
  hours: string
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

function parseFields(fields: TimeFields): { seconds: number; error: string } {
  const h = parseInt(fields.hours, 10) || 0
  const m = parseInt(fields.minutes, 10) || 0
  const s = parseInt(fields.seconds, 10) || 0

  if (h < 0 || m < 0 || s < 0) {
    return { seconds: 0, error: 'Valores negativos nao sao permitidos.' }
  }
  if (m > 59) {
    return { seconds: 0, error: 'Minutos devem ser entre 0 e 59.' }
  }
  if (s > 59) {
    return { seconds: 0, error: 'Segundos devem ser entre 0 e 59.' }
  }
  if (h > 99) {
    return { seconds: 0, error: 'Horas maximas: 99.' }
  }

  return { seconds: h * 3600 + m * 60 + s, error: '' }
}

export function TimeInput({ disabled, onApply }: TimeInputProps) {
  const [fields, setFields] = useState<TimeFields>({ hours: '00', minutes: '30', seconds: '00' })
  const [error, setError] = useState('')

  const hoursRef = useRef<HTMLInputElement>(null)
  const minutesRef = useRef<HTMLInputElement>(null)
  const secondsRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: keyof TimeFields, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '')
    setFields((prev) => ({ ...prev, [field]: sanitized }))
    setError('')
  }

  const handleBlur = (field: keyof TimeFields) => {
    const max = field === 'hours' ? 99 : 59
    setFields((prev) => ({ ...prev, [field]: clampField(prev[field], max) }))
  }

  const handleKeyDown = (
    field: keyof TimeFields,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === ':' || e.key === 'Tab') {
      e.preventDefault()
      if (field === 'hours') minutesRef.current?.focus()
      else if (field === 'minutes') secondsRef.current?.focus()
      else secondsRef.current?.blur()
    }
    if (e.key === 'Enter') {
      handleApply()
    }
  }

  const handleApply = () => {
    const { seconds, error: validationError } = parseFields(fields)
    if (validationError) {
      setError(validationError)
      return
    }
    if (seconds === 0) {
      setError('Defina um tempo maior que zero.')
      return
    }
    onApply(seconds)
  }

  useEffect(() => {
    handleBlur('hours')
    handleBlur('minutes')
    handleBlur('seconds')
  }, [])

  return (
    <div className="time-input-section">
      <span className="time-input-label">Tempo personalizado</span>
      <div className="time-input-row">
        <div className="time-field">
          <input
            ref={hoursRef}
            type="text"
            inputMode="numeric"
            className={`time-field-input ${error ? 'error' : ''}`}
            value={fields.hours}
            onChange={(e) => handleChange('hours', e.target.value)}
            onBlur={() => handleBlur('hours')}
            onKeyDown={(e) => handleKeyDown('hours', e)}
            disabled={disabled}
            maxLength={2}
            aria-label="Horas"
          />
          <span className="time-field-label">Horas</span>
        </div>
        <span className="time-separator">:</span>
        <div className="time-field">
          <input
            ref={minutesRef}
            type="text"
            inputMode="numeric"
            className={`time-field-input ${error ? 'error' : ''}`}
            value={fields.minutes}
            onChange={(e) => handleChange('minutes', e.target.value)}
            onBlur={() => handleBlur('minutes')}
            onKeyDown={(e) => handleKeyDown('minutes', e)}
            disabled={disabled}
            maxLength={2}
            aria-label="Minutos"
          />
          <span className="time-field-label">Minutos</span>
        </div>
        <span className="time-separator">:</span>
        <div className="time-field">
          <input
            ref={secondsRef}
            type="text"
            inputMode="numeric"
            className={`time-field-input ${error ? 'error' : ''}`}
            value={fields.seconds}
            onChange={(e) => handleChange('seconds', e.target.value)}
            onBlur={() => handleBlur('seconds')}
            onKeyDown={(e) => handleKeyDown('seconds', e)}
            disabled={disabled}
            maxLength={2}
            aria-label="Segundos"
          />
          <span className="time-field-label">Segundos</span>
        </div>
      </div>
      <span className="time-input-error">{error}</span>
      <button
        className="time-apply-btn"
        onClick={handleApply}
        disabled={disabled}
        type="button"
      >
        Aplicar
      </button>
    </div>
  )
}
