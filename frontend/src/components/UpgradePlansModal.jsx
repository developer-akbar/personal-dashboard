import React from 'react'
import { FiX, FiCheck, FiStar } from 'react-icons/fi'
import styles from './UpgradePlansModal.module.css'

const plans = [
  {
    name: 'Free',
    price: 0,
    cards: 3,
    refreshes: 5,
    color: '#6b7280',
    current: true
  },
  {
    name: 'Plus',
    price: 1,
    cards: 5,
    refreshes: 8,
    color: '#3b82f6',
    current: false
  },
  {
    name: 'Silver',
    price: 3,
    cards: 10,
    refreshes: 15,
    color: '#10b981',
    current: false
  },
  {
    name: 'Gold',
    price: 7,
    cards: 15,
    refreshes: 25,
    color: '#f59e0b',
    current: false
  },
  {
    name: 'Diamond',
    price: 9,
    cards: 25,
    refreshes: 40,
    color: '#8b5cf6',
    current: false
  }
]

export default function UpgradePlansModal({ open, onClose, currentPlan = 'Free' }) {
  if (!open) return null

  const handleUpgrade = (planName) => {
    if (planName === 'Free') {
      onClose()
      return
    }
    
    // Show educational message
    alert(`This is a demo application for educational purposes.\n\nUpgrading to ${planName} plan would normally cost ₹${plans.find(p => p.name === planName)?.price}/month.\n\nPayment integration is disabled in this demo.`)
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Choose Your Plan</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.subtitle}>
            This is a demo application for educational purposes. 
            Payment integration is disabled.
          </p>

          <div className={styles.plansGrid}>
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`${styles.planCard} ${plan.name === currentPlan ? styles.currentPlan : ''}`}
                style={{ borderColor: plan.color }}
              >
                {plan.name === currentPlan && (
                  <div className={styles.currentBadge}>
                    <FiStar />
                    Current Plan
                  </div>
                )}
                
                <div className={styles.planHeader}>
                  <h4 style={{ color: plan.color }}>{plan.name}</h4>
                  <div className={styles.price}>
                    <span className={styles.currency}>₹</span>
                    <span className={styles.amount}>{plan.price}</span>
                    <span className={styles.period}>/month</span>
                  </div>
                </div>

                <div className={styles.features}>
                  <div className={styles.feature}>
                    <FiCheck className={styles.checkIcon} />
                    <span>{plan.cards} Cards per Dashboard</span>
                  </div>
                  <div className={styles.feature}>
                    <FiCheck className={styles.checkIcon} />
                    <span>{plan.refreshes} Refreshes per Day</span>
                  </div>
                  {plan.name === 'Free' && (
                    <div className={styles.feature}>
                      <FiCheck className={styles.checkIcon} />
                      <span>Basic Features</span>
                    </div>
                  )}
                  {plan.name !== 'Free' && (
                    <div className={styles.feature}>
                      <FiCheck className={styles.checkIcon} />
                      <span>Priority Support</span>
                    </div>
                  )}
                  {plan.name === 'Diamond' && (
                    <div className={styles.feature}>
                      <FiCheck className={styles.checkIcon} />
                      <span>Advanced Analytics</span>
                    </div>
                  )}
                </div>

                <button
                  className={`${styles.upgradeButton} ${plan.name === currentPlan ? styles.currentButton : ''}`}
                  style={{ 
                    backgroundColor: plan.name === currentPlan ? '#6b7280' : plan.color,
                    color: 'white'
                  }}
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={plan.name === currentPlan}
                >
                  {plan.name === currentPlan ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <p className={styles.disclaimer}>
              <strong>Educational Demo:</strong> This application demonstrates 
              freemium model implementation. No actual payments are processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}