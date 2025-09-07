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

      setBills(billsResponse.data.bills || [])
      setWallets(walletsResponse.data.wallets || [])
      
      // Auto-select all bills and wallets
      setSelectedBills(billsResponse.data.bills || [])
      setSelectedWallets(walletsResponse.data.wallets || [])
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
    if (selectedBills.length === 0 || selectedWallets.length === 0) {
      toast.error('Please select at least one bill and one wallet')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/bill-optimizer/optimize', {
        bills: selectedBills,
        wallets: selectedWallets,
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
      toast.success('Strategy recalculated!')
    } catch (error) {
      console.error('Recalculation failed:', error)
      toast.error('Recalculation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStrategy = async (strategyId) => {
    if (!window.confirm('Are you sure you want to delete this strategy?')) {
      return
    }

    try {
      await api.delete(`/bill-optimizer/strategies/${strategyId}`)
      toast.success('Strategy deleted!')
      fetchSavedStrategies()
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete strategy')
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
      
      toast.success('Strategy loaded!')
    } catch (error) {
      console.error('Failed to load strategy:', error)
      toast.error('Failed to load strategy')
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

  const totalBillAmount = selectedBills.reduce((sum, bill) => sum + bill.amount, 0)
  const totalWalletAmount = selectedWallets.reduce((sum, wallet) => sum + wallet.amount, 0)

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
            <h3>{selectedBills.length}</h3>
            <p>Selected Bills</p>
            <span className={styles.amount}>₹ {totalBillAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <FiDollarSign />
          </div>
          <div className={styles.summaryContent}>
            <h3>{selectedWallets.length}</h3>
            <p>Selected Wallets</p>
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
          disabled={loading || selectedBills.length === 0 || selectedWallets.length === 0}
        >
          <FiCalculator /> Optimize Payments
        </button>
        
        <button 
          className="muted" 
          onClick={() => handleOptimize('minimize-leftover')}
          disabled={loading || selectedBills.length === 0 || selectedWallets.length === 0}
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

      {/* Bills Selection */}
      <div className={styles.section}>
        <h3>Unpaid Bills ({bills.length})</h3>
        <div className={styles.billsGrid}>
          {bills.map(bill => (
            <div 
              key={bill.id} 
              className={`${styles.billCard} ${selectedBills.find(b => b.id === bill.id) ? styles.selected : ''}`}
              onClick={() => toggleBillSelection(bill)}
            >
              <div className={styles.billHeader}>
                <input
                  type="checkbox"
                  checked={!!selectedBills.find(b => b.id === bill.id)}
                  onChange={() => toggleBillSelection(bill)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={styles.billLabel}>{bill.serviceLabel}</span>
              </div>
              <div className={styles.billDetails}>
                <span className={styles.billAmount}>₹ {bill.amount.toLocaleString('en-IN')}</span>
                <span className={styles.billDueDate}>
                  Due: {new Date(bill.dueDate).toLocaleDateString()}
                </span>
                <span className={`${styles.priority} ${styles[bill.priority]}`}>
                  {bill.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallets Selection */}
      <div className={styles.section}>
        <h3>Available Wallets ({wallets.length})</h3>
        <div className={styles.walletsGrid}>
          {wallets.map(wallet => (
            <div 
              key={wallet.id} 
              className={`${styles.walletCard} ${selectedWallets.find(w => w.id === wallet.id) ? styles.selected : ''}`}
              onClick={() => toggleWalletSelection(wallet)}
            >
              <div className={styles.walletHeader}>
                <input
                  type="checkbox"
                  checked={!!selectedWallets.find(w => w.id === wallet.id)}
                  onChange={() => toggleWalletSelection(wallet)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={styles.walletLabel}>{wallet.label}</span>
              </div>
              <div className={styles.walletAmount}>
                ₹ {wallet.amount.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
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