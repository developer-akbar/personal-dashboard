/**
 * Bill Payment Optimization Algorithm
 * 
 * Strategy:
 * 1. Sort bills by due date (urgent first)
 * 2. Sort wallets by amount (largest first)
 * 3. Use greedy algorithm to minimize transactions
 * 4. Try to pay multiple bills with single wallet when possible
 * 5. Minimize leftover amounts in wallets
 */

export function optimizeBillPayments(bills, wallets) {
  // Validate inputs
  if (!Array.isArray(bills) || !Array.isArray(wallets)) {
    throw new Error('Bills and wallets must be arrays');
  }

  if (bills.length === 0 || wallets.length === 0) {
    return {
      totalTransactions: 0,
      totalFees: 0,
      savings: 0,
      strategies: []
    };
  }

  // Sort bills by due date (urgent first), then by amount (largest first)
  const sortedBills = [...bills].sort((a, b) => {
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return b.amount - a.amount;
  });

  // Sort wallets by amount (largest first)
  const sortedWallets = [...wallets].sort((a, b) => b.amount - a.amount);

  const strategies = [];
  const usedBills = new Set();
  const usedWallets = new Set();

  // Calculate total amounts
  const totalBillAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalWalletAmount = wallets.reduce((sum, wallet) => sum + wallet.amount, 0);

  // For each wallet, try to pay as many bills as possible
  for (const wallet of sortedWallets) {
    if (usedWallets.has(wallet.id)) continue;

    const walletStrategy = {
      walletId: wallet.id,
      walletLabel: wallet.label,
      walletAmount: wallet.amount,
      bills: [],
      remainingAmount: wallet.amount
    };

    // Try to pay bills with this wallet
    for (const bill of sortedBills) {
      if (usedBills.has(bill.id)) continue;
      if (walletStrategy.remainingAmount < bill.amount) continue;

      // Can pay this bill
      walletStrategy.bills.push({
        billId: bill.id,
        serviceNumber: bill.serviceNumber,
        serviceLabel: bill.serviceLabel,
        amount: bill.amount,
        dueDate: bill.dueDate
      });

      walletStrategy.remainingAmount -= bill.amount;
      usedBills.add(bill.id);
    }

    // Only add strategy if it pays at least one bill
    if (walletStrategy.bills.length > 0) {
      strategies.push(walletStrategy);
      usedWallets.add(wallet.id);
    }
  }

  // Calculate metrics
  const totalTransactions = strategies.length;
  const totalFees = totalTransactions * 2; // Assuming ₹2 per transaction
  const maxPossibleFees = bills.length * 2; // If each bill paid separately
  const savings = maxPossibleFees - totalFees;

  return {
    totalTransactions,
    totalFees,
    savings,
    strategies
  };
}

/**
 * Alternative optimization strategy: Minimize leftover amounts
 */
export function optimizeMinimizeLeftover(bills, wallets) {
  // Sort bills by amount (largest first)
  const sortedBills = [...bills].sort((a, b) => b.amount - a.amount);
  
  // Sort wallets by amount (largest first)
  const sortedWallets = [...wallets].sort((a, b) => b.amount - a.amount);

  const strategies = [];
  const usedBills = new Set();
  const usedWallets = new Set();

  // For each wallet, find the best combination of bills
  for (const wallet of sortedWallets) {
    if (usedWallets.has(wallet.id)) continue;

    const walletStrategy = {
      walletId: wallet.id,
      walletLabel: wallet.label,
      walletAmount: wallet.amount,
      bills: [],
      remainingAmount: wallet.amount
    };

    // Use dynamic programming to find best bill combination
    const bestCombination = findBestBillCombination(sortedBills, wallet.amount, usedBills);
    
    for (const bill of bestCombination) {
      walletStrategy.bills.push({
        billId: bill.id,
        serviceNumber: bill.serviceNumber,
        serviceLabel: bill.serviceLabel,
        amount: bill.amount,
        dueDate: bill.dueDate
      });

      walletStrategy.remainingAmount -= bill.amount;
      usedBills.add(bill.id);
    }

    if (walletStrategy.bills.length > 0) {
      strategies.push(walletStrategy);
      usedWallets.add(wallet.id);
    }
  }

  const totalTransactions = strategies.length;
  const totalFees = totalTransactions * 2;
  const maxPossibleFees = bills.length * 2;
  const savings = maxPossibleFees - totalFees;

  return {
    totalTransactions,
    totalFees,
    savings,
    strategies
  };
}

/**
 * Find best combination of bills for a given wallet amount
 * Uses greedy approach with knapsack-like optimization
 */
function findBestBillCombination(bills, walletAmount, usedBills) {
  const availableBills = bills.filter(bill => 
    !usedBills.has(bill.id) && bill.amount <= walletAmount
  );

  if (availableBills.length === 0) return [];

  // Sort by amount (largest first) for greedy approach
  availableBills.sort((a, b) => b.amount - a.amount);

  const result = [];
  let remainingAmount = walletAmount;

  for (const bill of availableBills) {
    if (bill.amount <= remainingAmount) {
      result.push(bill);
      remainingAmount -= bill.amount;
    }
  }

  return result;
}

/**
 * Calculate optimization metrics
 */
export function calculateOptimizationMetrics(bills, wallets, strategies) {
  const totalBillAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalWalletAmount = wallets.reduce((sum, wallet) => sum + wallet.amount, 0);
  const totalTransactions = strategies.length;
  const totalFees = totalTransactions * 2;
  const maxPossibleFees = bills.length * 2;
  const savings = maxPossibleFees - totalFees;
  const efficiency = totalBillAmount / totalWalletAmount;

  return {
    totalBillAmount,
    totalWalletAmount,
    totalTransactions,
    totalFees,
    savings,
    efficiency: Math.min(efficiency, 1), // Cap at 100%
    coverage: (totalBillAmount / totalWalletAmount) * 100
  };
}