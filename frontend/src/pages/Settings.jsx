import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useSettings } from '../store/useSettings'

export default function Settings(){
  const { baseCurrency, exchangeRates, fetchSettings, saveSettings } = useSettings()
  const [localBase, setLocalBase] = useState(baseCurrency)
  const [rates, setRates] = useState(exchangeRates)

  useEffect(()=>{ fetchSettings() },[])
  useEffect(()=>{ setLocalBase(baseCurrency); setRates(exchangeRates) },[baseCurrency, exchangeRates])

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
    </div>
  )
}

