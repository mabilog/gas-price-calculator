import { useEffect, useRef, useState } from 'preact/hooks'
import { convertPrice } from './convert.js'
import { fetchLatestRate, loadSavedRate, saveRate } from './rate.js'
import './app.css'

const UNITS = {
  usd: {
    label: 'USD/US gal',
    field: 'USD per US gallon',
    result: 'CAD per litre',
    suffix: '/L',
  },
  cad: {
    label: 'CAD/L',
    field: 'CAD per litre',
    result: 'USD per US gallon',
    suffix: '/US gal',
  },
}

export function App() {
  const [price, setPrice] = useState('')
  const [direction, setDirection] = useState('usd')
  const [rate, setRate] = useState('')
  const [rateDate, setRateDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    const saved = loadSavedRate()
    if (saved) {
      setRate(saved.rate)
      setRateDate(saved.date)
      return
    }
    useLatest()
  }, [])

  async function useLatest() {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const latest = await fetchLatestRate()
      if (id !== requestId.current) return
      setRate(latest.rate)
      setRateDate(latest.date)
    } catch {
      if (id !== requestId.current) return
      setError('Could not load the latest rate.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  function onRateInput(event) {
    requestId.current += 1
    const value = event.currentTarget.value
    setRate(value)
    setRateDate('')
    setError('')
    setLoading(false)
    if (Number(value) > 0) saveRate(value, '')
  }

  const unit = UNITS[direction]
  const converted = convertPrice(price, rate, direction)
  const result = converted == null ? null : `$${converted.toFixed(3)}${unit.suffix}`

  return (
    <main>
      <h1>Gas price</h1>

      <label>
        {unit.field}
        <input
          inputmode="decimal"
          enterkeyhint="done"
          autocomplete="off"
          value={price}
          onInput={(event) => setPrice(event.currentTarget.value)}
        />
      </label>

      <div class="units" role="group" aria-label="Unit of the price you typed">
        {Object.entries(UNITS).map(([key, option]) => (
          <button
            key={key}
            type="button"
            aria-pressed={direction === key}
            onClick={() => setDirection(key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p class="result-label">{unit.result}</p>
      <p class="result" aria-live="polite">
        {result ?? '—'}
      </p>

      <label>
        CAD per 1 USD
        <input
          inputmode="decimal"
          enterkeyhint="done"
          autocomplete="off"
          value={rate}
          onInput={onRateInput}
        />
      </label>

      {rateDate ? <p class="meta">Bank of Canada rate for {rateDate}</p> : null}
      {error ? <p class="error">{error}</p> : null}

      <button class="fetch" type="button" onClick={useLatest} disabled={loading}>
        {loading ? 'Loading…' : 'Use latest rate'}
      </button>

      <p class="note">
        Converts the posted pump price using a US gallon (3.785 L), not an imperial gallon.
      </p>
    </main>
  )
}
