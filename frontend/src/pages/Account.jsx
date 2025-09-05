import React from 'react'
import { useEffect, useState } from 'react'
import { FiEdit, FiKey, FiUser, FiMail, FiPhone, FiImage, FiLogOut } from 'react-icons/fi'
import api from '../api/client'
import { useAuth } from '../store/useAuth'
import toast from 'react-hot-toast'
import ProfileEditModal from '../components/ProfileEditModal'
import PasswordChangeModal from '../components/PasswordChangeModal'
import styles from './Account.module.css'

export default function Account(){
  const { user, logout } = useAuth()
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: ''
  })
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Initialize with user data from auth store
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || ''
      })
    }
    
    // Fetch fresh data from server
    fetchUserData()
  }, [user])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/me')
      setUserData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        avatarUrl: data.avatarUrl || ''
      })
    } catch (error) {
      console.error('Failed to load profile data:', error)
      toast.error(error?.response?.data?.error || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (data) => {
    try {
      await api.put('/users/me', data)
      toast.success('Profile updated successfully')
      setUserData(data)
      // Update auth store
      const { useAuth } = await import('../store/useAuth')
      useAuth.getState().setUser(data)
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error(error?.response?.data?.error || 'Failed to update profile')
      throw error
    }
  }

  const handlePasswordChange = async (data) => {
    try {
      await api.post('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      toast.success('Password changed successfully')
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error(error?.response?.data?.error || 'Failed to change password')
      throw error
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  return (
    <div className="container">
      <header className="topbar">
        <button className="muted" onClick={()=>{ try{ if (window.history.length > 1) window.history.back(); else window.location.hash = '#/' }catch{ window.location.hash = '#/' } }}>←</button>
        <h3>Account Settings</h3>
      </header>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      ) : (
        <>
          {/* Profile Header - Back to Top */}
          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              {userData?.avatarUrl ? (
                <img 
                  src={userData.avatarUrl} 
                  alt="Profile" 
                  className={styles.avatar}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div 
                className={styles.avatarPlaceholder}
                style={{ display: userData?.avatarUrl ? 'none' : 'flex' }}
              >
                <FiUser />
              </div>
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{userData?.name || 'No name set'}</h2>
              <p className={styles.profileEmail}>{userData?.email || ''}</p>
              {userData?.phone && (
                <p className={styles.profilePhone}>{userData.phone}</p>
              )}
            </div>
          </div>

          {/* Account Information - Below Profile */}
          <div className={styles.infoSection}>
            <h3>Account Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <FiMail className={styles.infoIcon} />
                <div>
                  <label>Email Address</label>
                  <span>{userData?.email || ''}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <FiUser className={styles.infoIcon} />
                <div>
                  <label>Full Name</label>
                  <span>{userData?.name || 'Not set'}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <FiPhone className={styles.infoIcon} />
                <div>
                  <label>Mobile Number</label>
                  <span>{userData?.phone || 'Not set'}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <FiImage className={styles.infoIcon} />
                <div>
                  <label>Avatar</label>
                  <span>{userData?.avatarUrl ? 'Custom avatar' : 'Default avatar'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Actions - At Bottom */}
          <div className={styles.actionsGrid}>
            <button 
              className={styles.actionCard}
              onClick={() => setShowProfileModal(true)}
            >
              <div className={styles.actionIcon}>
                <FiEdit />
              </div>
              <div className={styles.actionContent}>
                <h3>Edit Profile</h3>
                <p>Update your personal information</p>
              </div>
            </button>

            <button 
              className={styles.actionCard}
              onClick={() => setShowPasswordModal(true)}
            >
              <div className={styles.actionIcon}>
                <FiKey />
              </div>
              <div className={styles.actionContent}>
                <h3>Change Password</h3>
                <p>Update your account password</p>
              </div>
            </button>

            <button 
              className={styles.actionCard}
              onClick={handleLogout}
            >
              <div className={styles.actionIcon}>
                <FiLogOut />
              </div>
              <div className={styles.actionContent}>
                <h3>Sign Out</h3>
                <p>Log out of your account</p>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      <ProfileEditModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSubmit={handleProfileUpdate}
        initialData={userData}
      />

      <PasswordChangeModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
      />
    </div>
  )
}