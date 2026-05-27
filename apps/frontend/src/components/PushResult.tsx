type Props = {
  result: {
    success: boolean
    created: string[]
    updated: string[]
    failed: { key: string; reason: string }[]
  }
  onReset: () => void
}

export default function PushResult({ result, onReset }: Props) {
  return (
    <div>
      <h2 className="step-title">
        {result.success ? '✅ Variables pushed!' : '⚠️ Partial success'}
      </h2>
      <p className="step-subtitle">Here's what happened:</p>

      {result.created.length > 0 && (
        <div className="stage-item active" style={{ marginBottom: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
          <strong style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>Created</strong>
          {result.created.map(k => (
            <code key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{k}</code>
          ))}
        </div>
      )}

      {result.updated.length > 0 && (
        <div className="stage-item" style={{ marginBottom: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
          <strong style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Updated</strong>
          {result.updated.map(k => (
            <code key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{k}</code>
          ))}
        </div>
      )}

      {result.failed.length > 0 && (
        <div className="stage-item" style={{ marginBottom: '10px', flexDirection: 'column', alignItems: 'flex-start', borderColor: '#ff6b6b' }}>
          <strong style={{ fontSize: '0.82rem', color: '#ff6b6b' }}>Failed</strong>
          {result.failed.map(f => (
            <div key={f.key}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{f.key}</code>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{f.reason}</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-ghost" style={{ marginTop: '16px' }} onClick={onReset}>
        Start over
      </button>
    </div>
  )
}