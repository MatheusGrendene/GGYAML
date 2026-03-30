type Props = { yaml: string }

export default function YAMLPreview({ yaml }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3>Live Preview</h3>
      <pre style={{
        flex: 1,
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: '1rem',
        borderRadius: '8px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        whiteSpace: 'pre-wrap'
      }}>
        {yaml}
      </pre>
    </div>
  )
}