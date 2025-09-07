import React, { useState, useEffect } from 'react'
import { FiRefreshCcw, FiTrash2, FiSettings, FiTrendingUp, FiDollarSign, FiCreditCard, FiSave, FiRotateCcw } from 'react-icons/fi'
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
  const [showDescription, setShowDescription] = useState(false) // For collapsible description
  const [checkedBills, setCheckedBills] = useState(new Set()) // Track checked bills
  const [checkedWallets, setCheckedWallets] = useState(new Set()) // Track checked wallets

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

          // Calculate fees for bills (1% fee + 18% GST on fee) and round amounts
          const billsWithFees = bills.map(bill => {
            const fee = bill.amount * 0.01 // 1% fee
            const gstOnFee = fee * 0.18 // 18% GST on fee
            const totalAmount = bill.amount + fee + gstOnFee
            
            return {
              ...bill,
              originalAmount: Math.round(bill.amount * 100) / 100, // Round original amount
              fee: Math.round(fee * 100) / 100, // Round fee
              gstOnFee: Math.round(gstOnFee * 100) / 100, // Round GST
              amount: Math.round(totalAmount * 100) / 100 // Round total amount to 2 decimal places
            }
          })

      // Filter out wallets with 0 balance
      const walletsWithBalance = wallets.filter(wallet => wallet.amount > 0)

          setBills(billsWithFees)
          setWallets(walletsWithBalance)
          
          // Set all bills and wallets as checked by default
          setCheckedBills(new Set(billsWithFees.map((_, index) => index)))
          setCheckedWallets(new Set(walletsWithBalance.map((_, index) => index)))
          
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

      // Create bill and wallet objects for API using actual data
      const billsForAPI = billAmounts.map((amount, index) => {
        const originalBill = bills.find(b => b.amount === amount);
        return {
          id: originalBill?.id || `bill_${index}`,
          serviceNumber: originalBill?.serviceNumber || `SERVICE_${index + 1}`,
          serviceLabel: originalBill?.serviceLabel || `Bill ${index + 1}`,
          amount: amount,
          dueDate: originalBill?.dueDate || new Date()
        };
      });

      const walletsForAPI = walletAmounts.map((amount, index) => {
        const originalWallet = wallets.find(w => w.amount === amount);
        return {
          id: originalWallet?.id || `wallet_${index}`,
          label: originalWallet?.label || `Wallet ${index + 1}`,
          amount: amount,
          currency: originalWallet?.currency || 'INR'
        };
      })

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

  // Handle bill checkbox changes
  const handleBillCheckboxChange = (index, checked) => {
    const newCheckedBills = new Set(checkedBills)
    if (checked) {
      newCheckedBills.add(index)
    } else {
      newCheckedBills.delete(index)
    }
    setCheckedBills(newCheckedBills)
    
    // Update bills input field
    const selectedBillsList = bills.filter((_, i) => newCheckedBills.has(i))
    const billsString = selectedBillsList.map(bill => bill.amount).join(', ')
    setBillsInput(billsString)
  }

  // Handle wallet checkbox changes
  const handleWalletCheckboxChange = (index, checked) => {
    const newCheckedWallets = new Set(checkedWallets)
    if (checked) {
      newCheckedWallets.add(index)
    } else {
      newCheckedWallets.delete(index)
    }
    setCheckedWallets(newCheckedWallets)
    
    // Update wallets input field
    const selectedWalletsList = wallets.filter((_, i) => newCheckedWallets.has(i))
    const walletsString = selectedWalletsList.map(wallet => wallet.amount).join(', ')
    setWalletsInput(walletsString)
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

      {/* Header with Collapsible Description */}
      <div className={styles.headerSection}>
        <div className={styles.headerTitle}>
          <h1 className={styles.mainHeading}>Bill Payment Strategy</h1>
          <button 
            className={styles.infoButton}
            onClick={() => setShowDescription(!showDescription)}
            title={showDescription ? "Hide description" : "Show description"}
          >
            <FiSettings />
          </button>
        </div>
        
        {showDescription && (
          <div className={styles.aboutContent}>
            <p className={styles.aboutDescription}>
              Welcome to the Bill Payment Optimizer! This tool helps you efficiently manage your bills and digital wallet balances.
              Select your bills and wallet balances below, and let the optimizer suggest an optimal payment strategy.
            </p>
            <h3>Key Features:</h3>
            <ol>
              <li><strong>Select Bills & Wallets:</strong> Check/uncheck bills and wallets to include in optimization</li>
              <li><strong>Optimize Payments:</strong> Click "Optimize" to get the best payment strategy</li>
              <li><strong>Save Strategies:</strong> Save results for future reference</li>
              <li><strong>Manual Entry:</strong> Add custom bills like Gas, DTH in the input fields</li>
            </ol>
          </div>
        )}
      </div>

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
          <FiSettings /> Optimize Payments
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

      {/* Bills and Wallets Selection */}
      <div className={styles.selectionSection}>
        <div className={styles.selectionGroup}>
          <h3>📋 Select Bills to Include</h3>
          <div className={styles.checkboxList}>
            {bills.map((bill, index) => (
              <label key={index} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={checkedBills.has(index)}
                  onChange={(e) => handleBillCheckboxChange(index, e.target.checked)}
                />
                <span className={styles.checkboxLabel}>
                  {bill.serviceLabel} - ₹{bill.amount.toLocaleString('en-IN')}
                  <small>(Original: ₹{bill.originalAmount.toLocaleString('en-IN')})</small>
                </span>
              </label>
            ))}
            {bills.length === 0 && (
              <p className={styles.noData}>No unpaid bills found</p>
            )}
          </div>
        </div>

        <div className={styles.selectionGroup}>
          <h3>💰 Select Wallets to Include</h3>
          <div className={styles.checkboxList}>
            {wallets.map((wallet, index) => (
              <label key={index} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={checkedWallets.has(index)}
                  onChange={(e) => handleWalletCheckboxChange(index, e.target.checked)}
                />
                <span className={styles.checkboxLabel}>
                  {wallet.label} - ₹{wallet.amount.toLocaleString('en-IN')}
                </span>
              </label>
            ))}
            {wallets.length === 0 && (
              <p className={styles.noData}>No wallet balances found</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <section className={styles.mainSection}>
        <form>
          <div className={styles.formFields}>
            <div className={styles.formField}>
              <label htmlFor="billsInput">Bills (comma-separated)</label>
              <textarea
                id="billsInput"
                value={billsInput}
                onChange={(e) => setBillsInput(e.target.value.replace(/[^0-9,]/g, '').replace(/(\,,*?)\,,*/g, '$1'))}
                placeholder="e.g., 1212.13, 856.45, 2341.78"
                className={styles.textarea}
                rows={3}
                required
              />
              <div className={styles.inputInfo}>
                <small>💡 Bills include 1% fee + 18% GST on fee. Original amounts: {bills.map(bill => `₹${bill.originalAmount}`).join(', ')}</small>
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="walletsInput">Wallet balances (comma-separated)</label>
              <textarea
                id="walletsInput"
                value={walletsInput}
                onChange={(e) => setWalletsInput(e.target.value.replace(/[^0-9,]/g, '').replace(/(\,,*?)\,,*/g, '$1'))}
                placeholder="e.g., 5000, 3200, 1500"
                className={styles.textarea}
                rows={3}
                required
              />
              <div className={styles.inputInfo}>
                <small>💡 Only wallets with balance &gt; ₹0 are shown</small>
              </div>
            </div>

            <div className={styles.formField}>
              <button 
                type="button" 
                className={styles.submitButton}
                onClick={() => handleOptimize('default')}
                disabled={loading || !billsInput.trim() || !walletsInput.trim()}
              >
                <FiSettings /> Optimize
              </button>
              <button 
                type="button" 
                className={styles.clearButton}
                onClick={() => {
                  setBillsInput('');
                  setWalletsInput('');
                  setOptimizationResult(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </section>

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

          {/* Payment Strategies Table */}
          <div className={styles.strategiesTable}>
            <table className={styles.optimizedStrategy}>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Pay Bills</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {optimizationResult.result?.strategies?.map((strategy, index) => (
                  <tr key={index}>
                    <td>{strategy.walletLabel}</td>
                    <td>
                      {strategy.bills.map((bill, billIndex) => (
                        <span key={billIndex}>
                          {bill.serviceLabel} (₹{bill.amount.toLocaleString('en-IN')})
                          {billIndex < strategy.bills.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      {strategy.bills.length > 0 && (
                        <span className={styles.totalAmount}>
                          {' '}(Total: ₹{strategy.bills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString('en-IN')})
                        </span>
                      )}
                    </td>
                    <td>₹ {strategy.remainingAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {optimizationResult.result?.strategies?.length > 0 && (
                  <tr className={styles.totalRow}>
                    <td>
                      Total: ₹{optimizationResult.result.strategies.reduce((sum, s) => sum + s.walletAmount, 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className={styles.saveStrategyButton}
                        onClick={() => {
                          // Save strategy functionality
                          toast.success('Strategy saved!')
                        }}
                      >
                        Save this strategy
                      </button>
                    </td>
                    <td>
                      ₹{optimizationResult.result.strategies.reduce((sum, s) => sum + s.remainingAmount, 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                        <p>Created: {new Date(strategy.createdAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}</p>
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