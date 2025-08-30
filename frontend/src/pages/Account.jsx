import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../store/useAuth'
import toast from 'react-hot-toast'

export default function Account(){
  const { user, logout } = useAuth()
  const [name,setName]=useState(user?.name||'')
  const [saving,setSaving]=useState(false)
  const [cpLoading,setCpLoading]=useState(false)

  useEffect(()=>{ (async()=>{
    try{ const { data } = await api.get('/users/me'); setName(data.name||'') }catch{}
  })() },[])

  async function saveProfile(e){
    e.preventDefault(); setSaving(true)
    try{ await api.put('/users/me',{ name }); toast.success('Profile updated'); (await import('../store/useAuth')).useAuth.getState().setUser({ name }) }
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
        <h2>Account</h2>
        <div className="spacer" />
        <button className="danger" onClick={logout}>Logout</button>
      </header>

      <div className="panel" style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:48,height:48,borderRadius:'999px',background:'#222',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:18}}>
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

