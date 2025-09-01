import React from 'react'

export default function ElectricityServiceCard({ item, onRefresh }){
  return (
    <article className="panel" style={{display:'flex',flexDirection:'column',gap:8,borderLeft:'4px solid var(--primary-bg)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
        <strong>Service: {item.serviceNumber}</strong>
        <small style={{opacity:.7}}>{item.lastStatus||'—'}</small>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,fontSize:12}}>
        <div><span style={{opacity:.7}}>Customer</span> <b>{item.customerName||'—'}</b></div>
        <div><span style={{opacity:.7}}>Bill Date</span> <b>{item.lastBillDate? new Date(item.lastBillDate).toLocaleDateString(): '—'}</b></div>
        <div><span style={{opacity:.7}}>Due Date</span> <b>{item.lastDueDate? new Date(item.lastDueDate).toLocaleDateString(): '—'}</b></div>
        <div><span style={{opacity:.7}}>Amount Due</span> <b>{item.lastAmountDue!=null? `₹ ${Number(item.lastAmountDue).toLocaleString('en-IN')}` : '—'}</b></div>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
        <button className="muted" onClick={onRefresh}>Fetch Bill</button>
        {(item.lastStatus==='DUE' && item.lastAmountDue>0) && (
          <a className="primary" href="https://payments.billdesk.com/MercOnline/SPDCLController" target="_blank" rel="noreferrer" style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}}>Pay Now</a>
        )}
      </div>
    </article>
  )
}

