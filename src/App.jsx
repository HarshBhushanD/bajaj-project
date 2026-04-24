import { useMemo, useState } from 'react'
import './App.css'

function App() {
  const [rawInput, setRawInput] = useState(
    [
      'A->B',
      'A->C',
      'B->D',
      'C->E',
      'E->F',
      'X->Y',
      'Y->Z',
      'Z->X',
      'G->H',
      'G->H',
      'G->I',
      'hello',
      '1->2',
      'A->',
    ].join('\n')
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [response, setResponse] = useState(null)

  const parsedList = useMemo(() => {
    return rawInput
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }, [rawInput])

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResponse(null)
    try {
      const base = import.meta.env.VITE_API_URL?.trim()
      const url = `${base ? base.replace(/\/+$/, '') : ''}/bfhl`
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedList }),
      })

      const json = await r.json().catch(() => null)
      if (!r.ok) {
        throw new Error(
          (json && (json.error || json.message)) ||
            `Request failed with status ${r.status}`
        )
      }
      setResponse(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bfhl">
        <header className="bfhl-header">
          <div>
            <h1>SRM BFHL Hierarchy API</h1>
            <p className="muted">
              Paste edges (one per line) and submit to <code>POST /bfhl</code>.
            </p>
          </div>
          <div className="bfhl-meta">
            <div className="pill">
              Items: <b>{parsedList.length}</b>
            </div>
          </div>
        </header>

        <div className="bfhl-grid">
          <form className="card" onSubmit={onSubmit}>
            <div className="card-title">Input</div>
            <textarea
              className="textarea"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              spellCheck={false}
              placeholder="A->B&#10;A->C&#10;B->D"
            />
            <div className="row">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit'}
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={loading}
                onClick={() => {
                  setError('')
                  setResponse(null)
                }}
              >
                Clear output
              </button>
            </div>
            <div className="hint">
              Dev: API runs at <code>http://localhost:3000</code> and Vite proxies{' '}
              <code>/bfhl</code>.
            </div>
          </form>

          <section className="card">
            <div className="card-title">Response</div>
            {error ? <div className="alert">{error}</div> : null}
            {!error && !response ? (
              <div className="muted">No response yet.</div>
            ) : null}
            {response ? (
              <pre className="pre">{JSON.stringify(response, null, 2)}</pre>
            ) : null}
          </section>
        </div>
      </div>
    </>
  )
}

export default App
