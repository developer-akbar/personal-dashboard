import React from 'react'
import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../store/useAuth'
import toast from 'react-hot-toast'

export default function Account(){
  const { user, logout } = useAuth()
  const [name,setName]=useState(user?.name||'')
  const [avatarUrl,setAvatarUrl]=useState(user?.avatarUrl||'')
  const [saving,setSaving]=useState(false)
  const [cpLoading,setCpLoading]=useState(false)

  useEffect(()=>{ (async()=>{
    try{ const { data } = await api.get('/users/me'); setName(data.name||''); setAvatarUrl(data.avatarUrl||'') }catch{}
  })() },[])

  async function saveProfile(e){
    e.preventDefault(); setSaving(true)
    try{ await api.put('/users/me',{ name, avatarUrl }); toast.success('Profile updated'); (await import('../store/useAuth')).useAuth.getState().setUser({ name, avatarUrl }) }
    catch{ toast.error('Failed to update') }
    finally{ setSaving(false) }
  }

  async function changePassword(e){
    e.preventDefault(); setCpLoading(true)
    const currentPassword = e.target.currentPassword.value
    const newPassword = e.target.newPassword.value
    const confirm = e.target.confirm.value
    if(newPassword !== confirm){ toast.error('Passwords do not match'); setCpLoading(false); return }
    try{ await api.post('/users/change-password',{ currentPassword, newPassword }); toast.success('Password changed') }
    catch{ toast.error('Failed to change password') }
    finally{ setCpLoading(false) }
  }

  return (
    <div className="container">
      <header className="topbar">
        <button className="muted" onClick={()=>{ try{ if (window.history.length > 1) window.history.back(); else window.location.hash = '#/' }catch{ window.location.hash = '#/' } }}>←</button>
        <h3>Account</h3>
      </header>

      <div className="panel" style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:48,height:48,borderRadius:'999px',background:'var(--avatar-bg)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:18}}>
          {(user?.name||user?.email||'?').slice(0,1).toUpperCase()}
        </div>
        <div>
          <div style={{fontWeight:700}}>{user?.name || '—'}</div>
          <div style={{opacity:.8,fontSize:12}}>{user?.email}</div>
        </div>
      </div>

      <div className="panel">
        <h3 style={{marginTop:0}}>Profile</h3>
        <form onSubmit={saveProfile} style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src={avatarUrl||'https://via.placeholder.com/64'} alt="avatar" width={48} height={48} style={{borderRadius:999}}/>
            <label style={{flex:1}}>Avatar URL<input value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="https://..." /></label>
          </div>
          <label>Name<input value={name} onChange={e=>setName(e.target.value)} required /></label>
          <button className="primary" type="submit" disabled={saving}>{saving? 'Saving...' : 'Save'}</button>
        </form>
      </div>

      <div className="panel">
        <h3 style={{marginTop:0}}>Change password</h3>
        <form onSubmit={changePassword} style={{display:'flex',flexDirection:'column',gap:12}}>
          <label>Current password<input name="currentPassword" type="password" required /></label>
          <label>New password<input name="newPassword" type="password" required minLength={6} /></label>
          <label>Confirm password<input name="confirm" type="password" required /></label>
          <button className="primary" type="submit" disabled={cpLoading}>{cpLoading? 'Updating...' : 'Update password'}</button>
        </form>
      </div>
    </div>
  )
}

