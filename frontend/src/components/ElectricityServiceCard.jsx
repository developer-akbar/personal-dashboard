import React from 'react'

export default function ElectricityServiceCard({ item, onRefresh, onEdit, onDelete }){
  return (
    <article className="panel" style={{display:'flex',flexDirection:'column',gap:8,borderLeft:'4px solid var(--primary-bg)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column'}}>
          <strong>{item.label || '—'}</strong>
          <small style={{opacity:.8}}>Service: {item.serviceNumber}</small>
        </div>
        <div style={{display:'inline-flex',gap:8,alignItems:'center'}}>
          <button className="muted" onClick={onRefresh} aria-label="Refresh">⟳</button>
          <div style={{position:'relative'}}>
            <details>
              <summary style={{cursor:'pointer'}}>⋮</summary>
              <div className="panel" style={{position:'absolute',right:0,top:'120%',minWidth:160,zIndex:10}}>
                <button className="muted" onClick={onEdit} style={{width:'100%',textAlign:'left'}}>Edit</button>
                <button className="danger" onClick={onDelete} style={{width:'100%',textAlign:'left'}}>Delete</button>
              </div>
            </details>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,fontSize:12}}>
        <div><span style={{opacity:.7}}>Customer</span> <b>{item.customerName||'—'}</b></div>
        <div><span style={{opacity:.7}}>Bill Date</span> <b>{item.lastBillDate? new Date(item.lastBillDate).toLocaleDateString(): '—'}</b></div>
        <div><span style={{opacity:.7}}>Due Date</span> <b>{item.lastDueDate? new Date(item.lastDueDate).toLocaleDateString(): '—'}</b></div>
        <div><span style={{opacity:.7}}>Amount Due</span> <b>{item.lastAmountDue!=null? `₹ ${Number(item.lastAmountDue).toLocaleString('en-IN')}` : '—'}</b></div>
      </div>
      {(item.lastStatus==='DUE' && item.lastAmountDue>0) && (
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <a className="primary" href="https://payments.billdesk.com/MercOnline/SPDCLController" target="_blank" rel="noreferrer" style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}}>Pay Now</a>
        </div>
      )}
    </article>
  )
}

