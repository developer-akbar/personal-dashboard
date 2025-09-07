import React, { useState, useEffect } from 'react'
import { FiRefreshCcw, FiTrash2, FiCalculator, FiTrendingUp, FiDollarSign, FiCreditCard, FiSave, FiRotateCcw } from 'react-icons/fi'
import api from '../api/client'
import toast from 'react-hot-toast'
import GlobalHeader from '../components/GlobalHeader'
import styles from './BillOptimizer.module.css'

export default function BillOptimizer() {
  const [bills, setBills] = useState([])
  const [wallets, setWallets] = useState([])
  const [selectedBills, setSelectedBills] = useState([])
  const [selectedWallets, setSelectedWallets] = useState([])
  const [optimizationResult, setOptimizationResult] = useState(null)
  const [savedStrategies, setSavedStrategies] = useState([])
  const [loading, setLoading] = useState(false)
  const [strategyName, setStrategyName] = useState('')
  const [showSavedStrategies, setShowSavedStrategies] = useState(false)
  const [billsInput, setBillsInput] = useState('')
  const [walletsInput, setWalletsInput] = useState('')

  useEffect(() => {
    fetchData()
    fetchSavedStrategies()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [billsResponse, walletsResponse] = await Promise.all([
        api.get('/bill-optimizer/unpaid-bills'),
        api.get('/bill-optimizer/wallet-amounts')
      ])

      const bills = billsResponse.data.bills || []
      const wallets = walletsResponse.data.wallets || []

      // Calculate fees for bills (1% fee + 18% GST on fee)
      const billsWithFees = bills.map(bill => {
        const fee = bill.amount * 0.01 // 1% fee
        const gstOnFee = fee * 0.18 // 18% GST on fee
        const totalAmount = bill.amount + fee + gstOnFee
        
        return {
          ...bill,
          originalAmount: bill.amount,
          fee: fee,
          gstOnFee: gstOnFee,
          amount: Math.round(totalAmount * 100) / 100 // Round to 2 decimal places
        }
      })

      // Filter out wallets with 0 balance
      const walletsWithBalance = wallets.filter(wallet => wallet.amount > 0)

      setBills(billsWithFees)
      setWallets(walletsWithBalance)
      
      // Auto-populate input fields with comma-separated values
      const billsString = billsWithFees.map(bill => bill.amount).join(', ')
      const walletsString = walletsWithBalance.map(wallet => wallet.amount).join(', ')
      
      setSelectedBills(billsWithFees)
      setSelectedWallets(walletsWithBalance)
      
      // Set input field values
      setBillsInput(billsString)
      setWalletsInput(walletsString)
      
      toast.success(`Loaded ${billsWithFees.length} bills and ${walletsWithBalance.length} wallets`)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load bills and wallets')
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedStrategies = async () => {
    try {
      const response = await api.get('/bill-optimizer/strategies')
      setSavedStrategies(response.data.strategies || [])
    } catch (error) {
      console.error('Failed to fetch strategies:', error)
    }
  }

  const handleOptimize = async (strategy = 'default') => {
    if (!billsInput.trim() || !walletsInput.trim()) {
      toast.error('Please enter bill amounts and wallet balances')
      return
    }

    setLoading(true)
    try {
      // Parse input values
      const billAmounts = billsInput.split(',').map(amount => parseFloat(amount.trim())).filter(amount => !isNaN(amount))
      const walletAmounts = walletsInput.split(',').map(amount => parseFloat(amount.trim())).filter(amount => !isNaN(amount))

      if (billAmounts.length === 0 || walletAmounts.length === 0) {
        toast.error('Please enter valid numbers')
        return
      }

      // Create bill and wallet objects for API
      const billsForAPI = billAmounts.map((amount, index) => ({
        id: `bill_${index}`,
        serviceNumber: `SERVICE_${index + 1}`,
        serviceLabel: `Bill ${index + 1}`,
        amount: amount,
        dueDate: new Date()
      }))

      const walletsForAPI = walletAmounts.map((amount, index) => ({
        id: `wallet_${index}`,
        label: `Wallet ${index + 1}`,
        amount: amount,
        currency: 'INR'
      }))

      const response = await api.post('/bill-optimizer/optimize', {
        bills: billsForAPI,
        wallets: walletsForAPI,
        strategy,
        strategyName: strategyName || `Optimization ${new Date().toLocaleString()}`
      })

      setOptimizationResult(response.data)
      toast.success('Optimization completed!')
      fetchSavedStrategies() // Refresh saved strategies
    } catch (error) {
      console.error('Optimization failed:', error)
      toast.error('Optimization failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculate = async (strategyId, strategy = 'default') => {
    setLoading(true)
    try {
      const response = await api.post(`/bill-optimizer/strategies/${strategyId}/recalculate`, {
        strategy
      })

      setOptimizationResult(response.data)
      toast.success('🔄 Strategy recalculated successfully!', {
        duration: 3000,
        icon: '✅'
      })
    } catch (error) {
      console.error('Recalculation failed:', error)
      toast.error('❌ Failed to recalculate strategy', {
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStrategy = async (strategyId) => {
    if (!window.confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/bill-optimizer/strategies/${strategyId}`)
      toast.success('🗑️ Strategy deleted successfully!', {
        duration: 3000,
        icon: '✅'
      })
      fetchSavedStrategies()
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('❌ Failed to delete strategy', {
        duration: 4000
      })
    }
  }

  const loadStrategy = async (strategyId) => {
    try {
      const response = await api.get(`/bill-optimizer/strategies/${strategyId}`)
      const strategy = response.data.strategy
      
      setOptimizationResult({
        result: strategy.optimizationResult,
        metrics: {
          totalBillAmount: strategy.totalAmount,
          totalWalletAmount: strategy.totalWalletAmount,
          totalTransactions: strategy.optimizationResult.totalTransactions,
          totalFees: strategy.optimizationResult.totalFees,
          savings: strategy.optimizationResult.savings
        }
      })
      
      toast.success('📋 Strategy loaded successfully!', {
        duration: 3000,
        icon: '✅'
      })
    } catch (error) {
      console.error('Failed to load strategy:', error)
      toast.error('❌ Failed to load strategy', {
        duration: 4000
      })
    }
  }

  const toggleBillSelection = (bill) => {
    setSelectedBills(prev => 
      prev.find(b => b.id === bill.id) 
        ? prev.filter(b => b.id !== bill.id)
        : [...prev, bill]
    )
  }

  const toggleWalletSelection = (wallet) => {
    setSelectedWallets(prev => 
      prev.find(w => w.id === wallet.id) 
        ? prev.filter(w => w.id !== wallet.id)
        : [...prev, wallet]
    )
  }

  const totalBillAmount = billsInput ? billsInput.split(',').reduce((sum, amount) => sum + (parseFloat(amount.trim()) || 0), 0) : 0
  const totalWalletAmount = walletsInput ? walletsInput.split(',').reduce((sum, amount) => sum + (parseFloat(amount.trim()) || 0), 0) : 0
  const billCount = billsInput ? billsInput.split(',').filter(amount => amount.trim()).length : 0
  const walletCount = walletsInput ? walletsInput.split(',').filter(amount => amount.trim()).length : 0

  return (
    <div className="container">
      <GlobalHeader title="Bill Payment Optimizer" showBackButton={true} />

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <FiCreditCard />
          </div>
          <div className={styles.summaryContent}>
            <h3>{billCount}</h3>
            <p>Bill Amounts</p>
            <span className={styles.amount}>₹ {totalBillAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <FiDollarSign />
          </div>
          <div className={styles.summaryContent}>
            <h3>{walletCount}</h3>
            <p>Wallet Balances</p>
            <span className={styles.amount}>₹ {totalWalletAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {optimizationResult && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>
              <FiTrendingUp />
            </div>
            <div className={styles.summaryContent}>
              <h3>{optimizationResult.metrics?.totalTransactions || 0}</h3>
              <p>Transactions</p>
              <span className={styles.savings}>Save ₹ {optimizationResult.metrics?.savings || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button 
          className="primary" 
          onClick={() => handleOptimize('default')}
          disabled={loading || !billsInput.trim() || !walletsInput.trim()}
        >
          <FiCalculator /> Optimize Payments
        </button>
        
        <button 
          className="muted" 
          onClick={() => handleOptimize('minimize-leftover')}
          disabled={loading || !billsInput.trim() || !walletsInput.trim()}
        >
          <FiRefreshCcw /> Minimize Leftover
        </button>

        <button 
          className="muted" 
          onClick={() => setShowSavedStrategies(!showSavedStrategies)}
        >
          <FiSave /> Saved Strategies ({savedStrategies.length})
        </button>

        <button 
          className="muted" 
          onClick={fetchData}
          disabled={loading}
        >
          <FiRefreshCcw className={loading ? 'spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Strategy Name Input */}
      <div className={styles.strategyNameInput}>
        <input
          type="text"
          placeholder="Enter strategy name (optional)"
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
        />
      </div>

      {/* Bills Input */}
      <div className={styles.section}>
        <h3>Bill Amounts (with fees)</h3>
        <div className={styles.inputGroup}>
          <label htmlFor="billsInput">Enter bill amounts separated by commas:</label>
          <textarea
            id="billsInput"
            value={billsInput}
            onChange={(e) => setBillsInput(e.target.value)}
            placeholder="e.g., 1212.13, 856.45, 2341.78"
            className={styles.textarea}
            rows={3}
          />
          <div className={styles.inputInfo}>
            <small>💡 Bills include 1% fee + 18% GST on fee. Original amounts: {bills.map(bill => `₹${bill.originalAmount}`).join(', ')}</small>
          </div>
        </div>
      </div>

      {/* Wallets Input */}
      <div className={styles.section}>
        <h3>Wallet Balances</h3>
        <div className={styles.inputGroup}>
          <label htmlFor="walletsInput">Enter wallet balances separated by commas:</label>
          <textarea
            id="walletsInput"
            value={walletsInput}
            onChange={(e) => setWalletsInput(e.target.value)}
            placeholder="e.g., 5000, 3200, 1500"
            className={styles.textarea}
            rows={3}
          />
          <div className={styles.inputInfo}>
            <small>💡 Only wallets with balance > ₹0 are shown</small>
          </div>
        </div>
      </div>

      {/* Optimization Result */}
      {optimizationResult && (
        <div className={styles.section}>
          <h3>Optimization Result</h3>
          <div className={styles.resultGrid}>
            <div className={styles.resultCard}>
              <h4>Total Transactions</h4>
              <span className={styles.resultValue}>
                {optimizationResult.metrics?.totalTransactions || 0}
              </span>
            </div>
            <div className={styles.resultCard}>
              <h4>Total Fees</h4>
              <span className={styles.resultValue}>
                ₹ {optimizationResult.metrics?.totalFees || 0}
              </span>
            </div>
            <div className={styles.resultCard}>
              <h4>Savings</h4>
              <span className={styles.savingsValue}>
                ₹ {optimizationResult.metrics?.savings || 0}
              </span>
            </div>
          </div>

          {/* Payment Strategies */}
          <div className={styles.strategiesList}>
            {optimizationResult.result?.strategies?.map((strategy, index) => (
              <div key={index} className={styles.strategyCard}>
                <div className={styles.strategyHeader}>
                  <h4>{strategy.walletLabel}</h4>
                  <span className={styles.walletAmount}>
                    ₹ {strategy.walletAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.billsList}>
                  {strategy.bills.map((bill, billIndex) => (
                    <div key={billIndex} className={styles.billItem}>
                      <span className={styles.billName}>{bill.serviceLabel}</span>
                      <span className={styles.billAmount}>₹ {bill.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.remainingAmount}>
                  Remaining: ₹ {strategy.remainingAmount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Strategies Modal */}
      {showSavedStrategies && (
        <div className={styles.modalOverlay} onClick={() => setShowSavedStrategies(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Saved Strategies</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowSavedStrategies(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              {savedStrategies.length === 0 ? (
                <p>No saved strategies found.</p>
              ) : (
                <div className={styles.strategiesList}>
                  {savedStrategies.map(strategy => (
                    <div key={strategy._id} className={styles.savedStrategyCard}>
                      <div className={styles.strategyInfo}>
                        <h4>{strategy.strategyName}</h4>
                        <p>Created: {new Date(strategy.createdAt).toLocaleString()}</p>
                        <p>Transactions: {strategy.optimizationResult.totalTransactions} | 
                           Savings: ₹ {strategy.optimizationResult.savings}</p>
                      </div>
                      <div className={styles.strategyActions}>
                        <button 
                          className="primary"
                          onClick={() => {
                            loadStrategy(strategy._id)
                            setShowSavedStrategies(false)
                          }}
                        >
                          Load
                        </button>
                        <button 
                          className="muted"
                          onClick={() => handleRecalculate(strategy._id)}
                        >
                          <FiRotateCcw /> Recalculate
                        </button>
                        <button 
                          className="danger"
                          onClick={() => handleDeleteStrategy(strategy._id)}
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}