import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function Register(){
  const nav = useNavigate()
  const { register, loading } = useAuth()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')

  return (
    <div className="centered">
      <div className="panel">
        <h2>Create account</h2>
        <form onSubmit={async (e)=>{e.preventDefault();await register(email,password);nav('/dashboard')}}>
          <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email"/></label>
          <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} required type="password"/></label>
          <button disabled={loading} className="primary" type="submit">{loading? 'Creating...' : 'Create account'}</button>
        </form>
        <p>Have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}

