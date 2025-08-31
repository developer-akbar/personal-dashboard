import React from 'react'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function Register(){
  const nav = useNavigate()
  const { register, loading } = useAuth()
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')

  async function onSubmit(e){
    e.preventDefault()
    const emailOk = /.+@.+\..+/.test(email)
    if(!emailOk) return toast.error('Enter a valid email')
    if(password.length < 6) return toast.error('Password must be at least 6 characters')
    const confirm = e.target?.confirm?.value
    if(confirm !== password) return toast.error('Passwords do not match')
    await register({ name, email, password })
    nav('/dashboard')
  }

  return (
    <div className="centered">
      <div className="panel" style={{minWidth:320, maxWidth:420, width:'100%'}}>
        <h2 style={{marginTop:0}}>Create account</h2>
        <form onSubmit={onSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <label>Name<input value={name} onChange={e=>setName(e.target.value)} required type="text" placeholder="Your name"/></label>
          <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="you@example.com"/></label>
          <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="At least 6 characters"/></label>
          <label>Confirm Password<input name="confirm" required type="password" placeholder="Re-enter password"/></label>
          <button disabled={loading} className="primary" type="submit">{loading? 'Creating...' : 'Create account'}</button>
        </form>
        <p style={{opacity:.8,marginTop:8}}>Have an account? <Link to="/login">Sign in</Link></p>
      </div>
      <Toaster/>
    </div>
  )
}

