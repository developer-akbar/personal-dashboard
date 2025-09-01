import React from 'react'

export default function ElectricityServiceCard({ item, onRefresh, onEdit, onDelete }){
  const onToggleMenu = (e)=>{
    e.stopPropagation()
    const menu = e.currentTarget.nextSibling
    if (menu){
      const showing = menu.style.display==='block'
      menu.style.display = showing? 'none' : 'block'
      const onDoc = (ev)=>{
        if (menu && !menu.contains(ev.target) && ev.target !== e.currentTarget){ menu.style.display='none'; document.removeEventListener('click', onDoc) }
      }
      if (!showing) document.addEventListener('click', onDoc)
    }
  }
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
            <div onClick={onToggleMenu} style={{cursor:'pointer', padding:'4px 8px'}}>⋮</div>
            <div className="panel" style={{position:'absolute',right:0,top:'120%',minWidth:160,zIndex:10,display:'none'}} onClick={(e)=> e.stopPropagation()}>
              <a onClick={onEdit} style={{display:'block',padding:'8px 12px',textDecoration:'none',cursor:'pointer'}}>Edit</a>
              <a onClick={onDelete} style={{display:'block',padding:'8px 12px',textDecoration:'none',cursor:'pointer'}}>Delete</a>
            </div>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,fontSize:12}}>
        <div><span style={{opacity:.7}}>Customer</span> <b>{item.customerName||'—'}</b></div>
        <div><span style={{opacity:.7}}>Bill Date</span> <b>{item.lastBillDate? new Date(item.lastBillDate).toLocaleDateString(): '—'}</b></div>
        <div><span style={{opacity:.7}}>Due Date</span> <b>{item.lastDueDate? new Date(item.lastDueDate).toLocaleDateString(): '—'}</b></div>
        <div><span style={{opacity:.7}}>Amount Due</span> <b style={{fontSize:16, color:'var(--primary-bg)'}}>{item.lastAmountDue!=null? `₹ ${Number(item.lastAmountDue).toLocaleString('en-IN')}` : '—'}</b></div>
        <div><span style={{opacity:.7}}>Billed Units</span> <b>{item.lastBilledUnits!=null? Number(item.lastBilledUnits).toLocaleString('en-IN') : '—'}</b></div>
      </div>
      {Array.isArray(item.lastThreeAmounts) && item.lastThreeAmounts.length>0 && (
        <div style={{fontSize:12,opacity:.85}}>
          <span style={{opacity:.7}}>Last 3 bills:</span>{' '}
          {item.lastThreeAmounts.map((x,i)=> (
            <span key={i} style={{marginRight:8}}>
              {x.closingDate? new Date(x.closingDate).toLocaleDateString(): '—'}: ₹ {Number(x.billAmount||0).toLocaleString('en-IN')}
            </span>
          ))}
        </div>
      )}
      {(item.lastStatus==='DUE' && item.lastAmountDue>0) && (
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <a className="primary" href="https://payments.billdesk.com/MercOnline/SPDCLController" target="_blank" rel="noreferrer" style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}}>Pay Now</a>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,opacity:.8}}>
        <span>Last refreshed: <b>{item.lastFetchedAt ? new Date(item.lastFetchedAt).toLocaleString() : '—'}</b></span>
      </div>
    </article>
  )
}

