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

  // Convert to simple arrays for optimization
  const billAmounts = bills.map(bill => bill.amount);
  const walletAmounts = wallets.map(wallet => wallet.amount);

  // Sort bills in descending order (largest first)
  const sortedBills = [...bills].sort((a, b) => b.amount - a.amount);
  const sortedBillAmounts = [...billAmounts].sort((a, b) => b - a);

  const strategies = [];
  let remainingBills = [...sortedBillAmounts];

  // For each wallet, find the best combination of bills
  for (let i = 0; i < walletAmounts.length; i++) {
    const walletAmount = walletAmounts[i];
    const wallet = wallets[i];
    
    const bestCombination = findBestCombination(remainingBills, walletAmount);
    
    if (bestCombination.length > 0) {
      const strategy = {
        walletId: wallet.id || `wallet_${i}`,
        walletLabel: wallet.label || `Wallet ${i + 1}`,
        walletAmount: walletAmount,
        bills: [],
        remainingAmount: walletAmount - bestCombination.reduce((sum, amount) => sum + amount, 0)
      };

      // Map back to original bill objects
      for (const amount of bestCombination) {
        const bill = sortedBills.find(b => b.amount === amount);
        if (bill) {
          strategy.bills.push({
            billId: bill.id,
            serviceNumber: bill.serviceNumber,
            serviceLabel: bill.serviceLabel,
            amount: bill.amount,
            dueDate: bill.dueDate
          });
        }
      }

      strategies.push(strategy);
      
      // Remove used bills from remaining bills
      remainingBills = remainingBills.filter(amount => !bestCombination.includes(amount));
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

// Recursive function to find best combination (matching your GitHub strategy)
function findBestCombination(bills, walletBalance) {
  let bestCombination = [];
  let allCombinations = [];

  function findCombinationRecursive(index, currentCombination, currentSum) {
    if (currentSum <= walletBalance) {
      bestCombination = [...currentCombination];
      allCombinations.push([...bestCombination]);
    }

    for (let i = index; i < bills.length; i++) {
      const newSum = currentSum + bills[i];
      if (newSum <= walletBalance) {
        currentCombination.push(bills[i]);
        findCombinationRecursive(i + 1, currentCombination, newSum);
        currentCombination.pop();
      }
    }
  }

  findCombinationRecursive(0, [], 0);

  // Find the combination with maximum sum
  let maxSum = -1;
  let bestCombinationArray = [];
  for (const combination of allCombinations) {
    const combinationSum = combination.reduce((acc, current) => acc + current, 0);
    if (combinationSum > maxSum) {
      maxSum = combinationSum;
      bestCombinationArray = combination;
    }
  }

  return bestCombinationArray;
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