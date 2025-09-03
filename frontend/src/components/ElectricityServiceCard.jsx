import React from 'react'
import toast from 'react-hot-toast'
import { FiRefreshCcw, FiMoreVertical, FiStar } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'

export default function ElectricityServiceCard({ item, onRefresh, onEdit, onDelete, highlight=false, domId, onTogglePin }){
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
    <article id={domId} className={`panel ${highlight? 'flash':''}`} style={{display:'flex',flexDirection:'column',gap:8,borderLeft:'4px solid var(--primary-bg)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column'}}>
          <strong>{item.label || '—'}</strong>
          <small style={{opacity:.8}}>Service: {String(item.serviceNumber||'')}
            {String(item.serviceNumber||'').length>=4 && (
              <b style={{marginLeft:4,fontSize:'13px'}}>••••{String(item.serviceNumber).slice(-4)}</b>
            )}
          </small>
        </div>
        <div style={{display:'inline-flex',gap:8,alignItems:'center'}}>
          <button className="muted" onClick={()=> onTogglePin?.(item, !item.pinned)} aria-label={item.pinned? 'Unpin':'Pin'} title={item.pinned? 'Unpin':'Pin'} style={{background:'transparent', border:0, cursor:'pointer'}}>
            {item.pinned ? <FaStar color="#fbbf24" /> : <FiStar style={{ color: '#888' }}/>} 
          </button>
          <button className="muted" onClick={onRefresh} aria-label="Refresh"><FiRefreshCcw/></button>
          <div style={{position:'relative'}}>
            <div onClick={onToggleMenu} style={{cursor:'pointer', padding:'4px 8px'}}><FiMoreVertical/></div>
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
        <div>
          <span style={{opacity:.7}}>Due Date</span>{' '}
          <b>{item.lastDueDate? new Date(item.lastDueDate).toLocaleDateString(): '—'}</b>
          {item.lastDueDate && (
            (()=>{
              const diffMs = new Date(item.lastDueDate).getTime() - Date.now()
              const days = Math.ceil(diffMs / (1000*60*60*24))
              const color = days < 0 ? '#ef4444' : (days <= 3 ? '#f59e0b' : '#10b981')
              const text = days < 0 ? `Overdue ${Math.abs(days)} days` : `Due in ${days} days`
              return <span style={{marginLeft:8, color, fontWeight:600}}>{text}</span>
            })()
          )}
        </div>
        <div>
          <span style={{opacity:.7}}>Amount Due</span>{' '}
          <b style={{fontSize:16, color:item.lastStatus==='DUE'?'#0ea5e9':'#94a3b8'}}>
            {item.lastStatus==='DUE' ? `₹ ${Number(item.lastAmountDue||0).toLocaleString('en-IN')}` : '₹ 0'}
          </b>
        </div>
        <div><span style={{opacity:.7}}>Billed Units</span> <b>{item.lastBilledUnits!=null? Number(item.lastBilledUnits).toLocaleString('en-IN') : '—'}</b></div>
      </div>
      {Array.isArray(item.lastThreeAmounts) && item.lastThreeAmounts.length>0 && (
        <div style={{fontSize:12,opacity:.85}}>
          <span style={{opacity:.7}}>Last 3 bills:</span>{' '}
          {item.lastThreeAmounts
            .filter(x=>{
              const cur = item.lastBillDate ? new Date(item.lastBillDate) : null
              const cd = x.closingDate ? new Date(x.closingDate) : null
              if (!cur || !cd) return true
              return !(cur.getMonth()===cd.getMonth() && cur.getFullYear()===cd.getFullYear())
            })
            .map((x,i)=> (
            <span key={i} style={{marginRight:8}}>
              {x.closingDate? new Date(x.closingDate).toLocaleDateString(): '—'}: <b>₹ {Number(x.billAmount||0).toLocaleString('en-IN')}</b>
            </span>
          ))}
        </div>
      )}
      {(item.lastStatus==='DUE' && Number(item.lastAmountDue||0)>0) && (
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <button className={`primary pay-now ${(()=>{ const due = item.lastDueDate? new Date(item.lastDueDate).getTime() - Date.now() : null; return (due!=null && due<0)? 'danger' : '' })()}`} style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}} onClick={async()=>{
            try{ await navigator.clipboard.writeText(String(item.serviceNumber||'')); }catch{}
            toast.success('Service Number copied')
            // Give the user a moment to read the toast before opening new tab
            await new Promise(r=> setTimeout(r, 600))
            window.open('https://payments.billdesk.com/MercOnline/SPDCLController','_blank','noopener,noreferrer')
          }}>Pay Now</button>
        </div>
      )}
      {item.lastStatus==='PAID' && (
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <span title="Bill paid" style={{background:'#16a34a', color:'#fff', padding:'8px 12px', borderRadius:8, fontWeight:700}}>Paid ₹ {Number(item.lastAmountDue||0).toLocaleString('en-IN')}</span>
        </div>
      )}
      {item.lastStatus==='NO_DUES' && (
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <span title="No dues" style={{background:'#374151', color:'#fff', padding:'8px 12px', borderRadius:8, fontWeight:700}}>No dues</span>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,opacity:.8}}>
        <span>Last refreshed: <b>{item.lastFetchedAt ? new Date(item.lastFetchedAt).toLocaleString() : '—'}</b> {item.lastFetchedAt && (
          <span style={{opacity:.75}}>(
            {(() => {
              const diffMs = Date.now() - new Date(item.lastFetchedAt).getTime()
              const s = Math.floor(diffMs/1000)
              if (s < 60) return `${s}s ago`
              const m = Math.floor(s/60)
              if (m < 60) return `${m}m ago`
              const h = Math.floor(m/60)
              if (h < 24) return `${h}h ago`
              const d = Math.floor(h/24)
              return `${d}d ago`
            })()}
          )</span>
        )}</span>
      </div>
    </article>
  )
}

