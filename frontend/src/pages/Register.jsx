import React from 'react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Register(){
  const nav = useNavigate()
  const { register, loading } = useAuth()
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [phone,setPhone]=useState('')
  const [password,setPassword]=useState('')
  const [captcha,setCaptcha]=useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const widgetRef = useRef(null)

  // Handle phone number input - only allow digits and limit to 10
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(value)
  }

  useEffect(()=>{
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!siteKey) return
    function render(){
      if (window.turnstile && widgetRef.current && !widgetRef.current._rendered){
        window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (t)=> setCaptcha(t),
          'error-callback': ()=> { setCaptcha(''); toast.error('Captcha failed, retry', { duration: 2000 }) },
          'expired-callback': ()=> { setCaptcha(''); toast('Captcha expired', { icon: '⚠️' }) }
        })
        widgetRef.current._rendered = true
      } else {
        setTimeout(render, 300)
      }
    }
    render()
  },[])

  async function onSubmit(e){
    e.preventDefault()
    const emailOk = /.+@.+\..+/.test(email)
    if(!emailOk) return toast.error('Enter a valid email', { duration: 2000 })
    
    // Mobile number validation for Indian numbers
    if(phone && !/^[6-9]\d{9}$/.test(phone)) {
      return toast.error('Enter a valid 10-digit Indian mobile number (starting with 6-9)', { duration: 2000 })
    }
    
    if(password.length < 6) return toast.error('Password must be at least 6 characters', { duration: 2000 })
    const confirm = e.target?.confirm?.value
    if(confirm !== password) return toast.error('Passwords do not match', { duration: 2000 })
    try{
      if ((import.meta.env.VITE_TURNSTILE_SITE_KEY) && !captcha){ toast.error('Complete captcha', { duration: 2000 }); return }
      await register({ name, email, phone, password, captchaToken: captcha })
      nav('/amazon')
    }catch(e){
      toast.error(e?.response?.data?.error || e?.message || 'Registration failed', { duration: 2000 })
    }
  }

  return (
    <div className="centered">
      <div className="panel" style={{minWidth:320, maxWidth:420, width:'100%'}}>
        <h2 style={{marginTop:0}}>Create account</h2>
        <form onSubmit={onSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <label>Name<input value={name} onChange={e=>setName(e.target.value)} required type="text" placeholder="Your name"/></label>
          <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="you@example.com"/></label>
          <label>Mobile Number<input value={phone} onChange={handlePhoneChange} type="tel" placeholder="9876543210" maxLength="10"/></label>
          <label>Password
            <div style={{ position: 'relative' }}>
              <input 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
                type={showPassword ? "text" : "password"} 
                placeholder="At least 6 characters"
                style={{ paddingRight: '40px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </label>
          <label>Confirm Password
            <div style={{ position: 'relative' }}>
              <input 
                name="confirm" 
                required 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Re-enter password"
                style={{ paddingRight: '40px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </label>
          <div ref={widgetRef} className="cf-turnstile"></div>
          {!import.meta.env.VITE_TURNSTILE_SITE_KEY && (
            <small style={{opacity:.7}}>Captcha disabled (no site key configured)</small>
          )}
          <button disabled={loading} className="primary" type="submit">{loading? 'Creating...' : 'Create account'}</button>
        </form>
        <p style={{opacity:.8,marginTop:8}}>Have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}

