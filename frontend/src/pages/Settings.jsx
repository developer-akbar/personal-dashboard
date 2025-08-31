import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableItem } from '../shared/SortableItem'
import api from '../api/client'
import { useSettings } from '../store/useSettings'

export default function Settings(){
  const { baseCurrency, exchangeRates, fetchSettings, saveSettings } = useSettings()
  const [localBase, setLocalBase] = useState(baseCurrency)
  const [rates, setRates] = useState(exchangeRates)
  const [organizing, setOrganizing] = useState(false)
  const [items, setItems] = useState([]) // {id,label}
  const [loadingOrder, setLoadingOrder] = useState(false)

  useEffect(()=>{ fetchSettings() },[])
  useEffect(()=>{ setLocalBase(baseCurrency); setRates(exchangeRates) },[baseCurrency, exchangeRates])
  useEffect(()=>{ (async()=>{
    if(!organizing) return
    setLoadingOrder(true)
    try{ const { data } = await api.get('/accounts'); setItems(data.map(a=> ({ id: a.id, label: a.label }))) }
    finally{ setLoadingOrder(false) }
  })() },[organizing])

  const currencies = useMemo(()=>['USD','INR','EUR','GBP','CAD','AUD'],[])

  return (
    <div className="container">
      <h2>Settings</h2>
      <form onSubmit={async (e)=>{e.preventDefault(); await saveSettings({ baseCurrency: localBase, exchangeRates: rates });}} className="panel" style={{display:'flex',flexDirection:'column',gap:12}}>
        <label>Base currency
          <select value={localBase} onChange={e=> setLocalBase(e.target.value)}>
            {currencies.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <div>
          <p style={{opacity:.8,fontSize:12,margin:'6px 0'}}>Enter exchange rates relative to base currency (1.0 for base). Example: if base is USD and 1 USD = 83 INR, set INR = 83.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8}}>
            {currencies.filter(c=> c!==localBase).map(c => (
              <label key={c}>{c}
                <input type="number" min="0" step="0.0001" value={rates?.[c] ?? ''} onChange={e=> setRates({ ...rates, [c]: e.target.value ? Number(e.target.value) : undefined })} />
              </label>
            ))}
          </div>
        </div>
        <button className="primary" type="submit">Save</button>
      </form>

      <div className="panel" style={{marginTop:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{margin:0}}>Organize accounts order</h3>
          <button className="muted" onClick={()=> setOrganizing(v=>!v)}>{organizing? 'Close' : 'Organize'}</button>
        </div>
        {organizing && (
          <div style={{marginTop:12}}>
            {loadingOrder ? (
              <div style={{opacity:.8}}>Loading accounts…</div>
            ) : (
              <DndContext collisionDetection={closestCenter} onDragEnd={({active,over})=>{
                if(!over || active.id===over.id) return
                const oldIndex = items.findIndex(i=>i.id===active.id)
                const newIndex = items.findIndex(i=>i.id===over.id)
                setItems(arrayMove(items, oldIndex, newIndex))
              }}>
                <SortableContext items={items.map(i=>i.id)} strategy={verticalListSortingStrategy}>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {items.map(i=> (
                      <SortableItem key={i.id} id={i.id}>
                        {(handle)=> (
                          <div className="panel" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <span {...handle} style={{cursor:'grab',opacity:.8}}>⋮⋮</span>
                              <strong>{i.label}</strong>
                            </div>
                            <small style={{opacity:.6}}>{i.id.slice(-6)}</small>
                          </div>
                        )}
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button className="muted" onClick={()=> setOrganizing(false)}>Cancel</button>
              <button className="primary" onClick={async()=>{
                const payload = { items: items.map((it,idx)=> ({ id: it.id, order: (idx+1)*100 })) }
                await api.post('/accounts/reorder', payload)
              }}>Save order</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

