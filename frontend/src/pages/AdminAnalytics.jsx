import React, { useState, useEffect } from 'react'
import { FiUsers, FiCreditCard, FiZap, FiTrendingUp, FiRefreshCw, FiTrash2, FiEdit, FiEye, FiUserX, FiUserCheck, FiUserX as FiUserDeactivate } from 'react-icons/fi'
import { FiBarChart3, FiPieChart, FiActivity } from 'react-icons/fi'
import api from '../api/client'
import toast from 'react-hot-toast'
import GlobalHeader from '../components/GlobalHeader'
import styles from './AdminAnalytics.module.css'

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    users: [],
    totalUsers: 0,
    userTypes: {},
    amazonAccounts: 0,
    electricityServices: 0,
    totalRefreshes: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [filters, setFilters] = useState({
    userType: '',
    subscription: '',
    search: ''
  })

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/analytics')
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please login again.')
        // Redirect to login
        window.location.href = '/login'
        return
      }
      
      if (error?.response?.status === 403) {
        toast.error('Admin access required')
        // Redirect to home
        window.location.href = '/'
        return
      }
      
      if (error?.response?.status === 404) {
        toast.error('Analytics API not found. Please check server configuration.')
        return
      }
      
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      if (action === 'delete') {
        await api.delete(`/api/admin/users/${userId}`)
        toast.success('User deleted successfully')
      } else if (action === 'toggle-status') {
        await api.post(`/api/admin/users/${userId}/toggle-status`, data)
        toast.success(`User ${data.active ? 'activated' : 'deactivated'} successfully`)
      } else if (action === 'reset-limits') {
        await api.post(`/api/admin/users/${userId}/reset-limits`)
        toast.success('User limits reset successfully')
      } else {
        await api.post(`/api/admin/users/${userId}/${action}`, data)
        toast.success(`User ${action} successful`)
      }
      fetchAnalytics() // Refresh data
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      // Avoid duplicate toasts: show backend message if present, otherwise rely on global interceptor
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error
      if (backendMessage) {
        toast.error(backendMessage)
      }
    }
  }

  const handleDeleteUser = (user) => {
    setUserToDelete(user)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (userToDelete) {
      await handleUserAction(userToDelete.id, 'delete')
      setShowDeleteConfirm(false)
      setUserToDelete(null)
    }
  }

  const filteredUsers = analytics.users.filter(user => {
    const matchesType = !filters.userType || user.userType === filters.userType
    const matchesSubscription = !filters.subscription || user.subscription === filters.subscription
    const matchesSearch = !filters.search || 
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesType && matchesSubscription && matchesSearch
  })

  const userTypeStats = Object.entries(analytics.userTypes).map(([type, count]) => ({
    type,
    count,
    percentage: ((count / analytics.totalUsers) * 100).toFixed(1)
  }))

  if (loading) {
    return (
      <div className="container">
        <GlobalHeader title="Admin Analytics" showBackButton={true} />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <GlobalHeader title="Admin Analytics" showBackButton={true} />

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <a href="#/bill-optimizer" className="primary" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          🧮 Bill Payment Optimizer
        </a>
      </div>

      {/* Overview Cards */}
      <div className={styles.overviewGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiUsers />
          </div>
          <div className={styles.statContent}>
            <h3>{analytics.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiCreditCard />
          </div>
          <div className={styles.statContent}>
            <h3>{analytics.amazonAccounts}</h3>
            <p>Amazon Accounts</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiZap />
          </div>
          <div className={styles.statContent}>
            <h3>{analytics.electricityServices}</h3>
            <p>Electricity Services</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiRefreshCw />
          </div>
          <div className={styles.statContent}>
            <h3>{analytics.totalRefreshes}</h3>
            <p>Total Refreshes</p>
          </div>
        </div>
      </div>

      {/* User Type Distribution */}
      <div className={styles.section}>
        <h2>User Type Distribution</h2>
        <div className={styles.chartContainer}>
          {userTypeStats.map(stat => (
            <div key={stat.type} className={styles.chartItem}>
              <div className={styles.chartBar}>
                <div 
                  className={styles.chartFill}
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
              <div className={styles.chartLabel}>
                <span className={styles.chartType}>{stat.type}</span>
                <span className={styles.chartCount}>{stat.count} ({stat.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <h2>User Management</h2>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className={styles.searchInput}
          />
          <select
            value={filters.userType}
            onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
            className={styles.filterSelect}
          >
            <option value="">All User Types</option>
            <option value="Free">Free</option>
            <option value="Admin">Admin</option>
          </select>
          <select
            value={filters.subscription}
            onChange={(e) => setFilters(prev => ({ ...prev, subscription: e.target.value }))}
            className={styles.filterSelect}
          >
            <option value="">All Subscriptions</option>
            <option value="Free">Free</option>
            <option value="Plus">Plus</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Diamond">Diamond</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.section}>
        <div className={styles.tableContainer}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Subscription</th>
                <th>Amazon Cards</th>
                <th>Electricity Cards</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} />
                        ) : (
                          <FiUsers />
                        )}
                      </div>
                      <div>
                        <div className={styles.userName}>{user.name || 'No name'}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[user.userType?.toLowerCase()] || styles.free}`}>
                      {user.userType || 'Free'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[user.subscription?.toLowerCase()] || styles.free}`}>
                      {user.subscription || 'Free'}
                    </span>
                  </td>
                  <td>{user.amazonAccounts || 0}</td>
                  <td>{user.electricityServices || 0}</td>
                  <td>
                    {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          setSelectedUser(user)
                          setShowUserDetails(true)
                        }}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleUserAction(user.id, 'toggle-status', { 
                          active: user.active === false ? true : false
                        })}
                        title={user.active === false ? 'Activate' : 'Deactivate'}
                      >
                        {user.active === false ? <FiUserCheck /> : <FiUserDeactivate />}
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleUserAction(user.id, 'reset-limits')}
                        title="Reset Limits"
                      >
                        <FiRefreshCw />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.dangerBtn}`}
                        onClick={() => handleDeleteUser(user)}
                        title="Delete User"
                      >
                        <FiUserX />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowUserDetails(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>User Details</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowUserDetails(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.userDetails}>
                <div className={styles.detailRow}>
                  <label>Name:</label>
                  <span>{selectedUser.name || 'Not set'}</span>
                </div>
                <div className={styles.detailRow}>
                  <label>Email:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className={styles.detailRow}>
                  <label>Phone:</label>
                  <span>{selectedUser.phone || 'Not set'}</span>
                </div>
                <div className={styles.detailRow}>
                  <label>User Type:</label>
                  <span className={`${styles.badge} ${styles[selectedUser.userType?.toLowerCase()] || styles.free}`}>
                    {selectedUser.userType || 'Free'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <label>Subscription:</label>
                  <span className={`${styles.badge} ${styles[selectedUser.subscription?.toLowerCase()] || styles.free}`}>
                    {selectedUser.subscription || 'Free'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <label>Amazon Accounts:</label>
                  <span>{selectedUser.amazonAccounts || 0}</span>
                </div>
                <div className={styles.detailRow}>
                  <label>Electricity Services:</label>
                  <span>{selectedUser.electricityServices || 0}</span>
                </div>
                <div className={styles.detailRow}>
                  <label>Created:</label>
                  <span>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'Unknown'}</span>
                </div>
                <div className={styles.detailRow}>
                  <label>Last Active:</label>
                  <span>{selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.primaryBtn}
                onClick={() => {
                  setShowUserDetails(false)
                  // Add edit user functionality here
                }}
              >
                <FiEdit /> Edit User
              </button>
              <button 
                className={styles.secondaryBtn}
                onClick={() => setShowUserDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Delete User</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <p>Are you sure you want to delete this user?</p>
              <div className={styles.userInfo}>
                <strong>Name:</strong> {userToDelete.name || 'No name'}<br/>
                <strong>Email:</strong> {userToDelete.email}<br/>
                <strong>Type:</strong> {userToDelete.userType || 'Free'}<br/>
                <strong>Subscription:</strong> {userToDelete.subscription || 'Free'}
              </div>
              <p style={{ color: '#dc2626', fontWeight: 'bold' }}>
                ⚠️ This action cannot be undone. The user will be permanently deleted.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.dangerBtn}
                onClick={confirmDelete}
                style={{ background: '#dc2626', color: 'white' }}
              >
                <FiUserX /> Delete User
              </button>
              <button 
                className={styles.secondaryBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}