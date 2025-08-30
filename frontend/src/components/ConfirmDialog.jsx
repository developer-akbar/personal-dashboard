export default function ConfirmDialog({ open, title='Are you sure?', message, onCancel, onConfirm }){
  if(!open) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <div style={{background:'#0b0b0b',border:'1px solid #1f1f1f',borderRadius:12,padding:16,minWidth:300}}>
        <h3 style={{marginTop:0}}>{title}</h3>
        {message && <p style={{opacity:.85}}>{message}</p>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
          <button className="muted" onClick={onCancel}>Cancel</button>
          <button className="danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

