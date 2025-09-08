import React, { useState, useEffect } from "react";
import {
  FiRefreshCcw,
  FiTrash2,
  FiSettings,
  FiTrendingUp,
  FiDollarSign,
  FiCreditCard,
  FiSave,
  FiRotateCcw,
  FiInfo,
} from "react-icons/fi";
import api from "../api/client";
import toast from "react-hot-toast";
import GlobalHeader from "../components/GlobalHeader";
import GlobalTabs from "../components/GlobalTabs";
import SwipeableContent from "../components/SwipeableContent";
import styles from "./BillOptimizer.module.css";

export default function BillOptimizer() {
  const [bills, setBills] = useState([]);
  const [originalBills, setOriginalBills] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [selectedWallets, setSelectedWallets] = useState([]);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [strategyName, setStrategyName] = useState("");
  const [showSavedStrategies, setShowSavedStrategies] = useState(false);
  const [billsInput, setBillsInput] = useState("");
  const [originalBillsInput, setOriginalBillsInput] = useState("");
  const [walletsInput, setWalletsInput] = useState("");
  const [showDescription, setShowDescription] = useState(false); // For collapsible description
  const [checkedBills, setCheckedBills] = useState(new Set()); // Track checked bills
  const [checkedWallets, setCheckedWallets] = useState(new Set()); // Track checked wallets
  const [allBillsSelected, setAllBillsSelected] = useState(true); // Select all bills
  const [allWalletsSelected, setAllWalletsSelected] = useState(true); // Select all wallets
  const [showBillsInfo, setShowBillsInfo] = useState(false); // Toggle bills info
  const [showWalletsInfo, setShowWalletsInfo] = useState(false); // Toggle wallets info

  useEffect(() => {
    fetchData();
    fetchSavedStrategies();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [billsResponse, walletsResponse] = await Promise.all([
        api.get("/api/bill-optimizer/unpaid-bills"),
        api.get("/api/bill-optimizer/wallet-amounts"),
      ]);

      const bills = billsResponse.data.bills || [];
      const wallets = walletsResponse.data.wallets || [];

      // Calculate fees for bills (1% fee + 18% GST on fee) and round amounts
      const billsWithFees = bills.map((bill) => {
        const fee = bill.amount * 0.01; // 1% fee
        const gstOnFee = fee * 0.18; // 18% GST on fee
        const totalAmount = bill.amount + fee + gstOnFee;

        return {
          ...bill,
          originalAmount: Math.round(bill.amount), // Round original amount to 0 decimals
          fee: Math.round(fee), // Round fee to 0 decimals
          gstOnFee: Math.round(gstOnFee), // Round GST to 0 decimals
          amount: Math.round(totalAmount), // Round total amount to 0 decimals
        };
      });

      const originalBills = bills.map((bill) => ({
        ...bill,
        amount: Math.round(bill.amount), // Round original amount to 0 decimals
      }));

      // Filter out wallets with 0 balance and round amounts
      const walletsWithBalance = wallets
        .filter((wallet) => wallet.amount > 0)
        .map((wallet) => ({
          ...wallet,
          amount: Math.round(wallet.amount), // Round wallet amount to 0 decimals
        }));

      setBills(billsWithFees);
      setOriginalBills(originalBills);
      setWallets(walletsWithBalance);

      // Set all bills and wallets as checked by default
      setCheckedBills(new Set(billsWithFees.map((_, index) => index)));
      setCheckedWallets(new Set(walletsWithBalance.map((_, index) => index)));

      // Auto-populate input fields with comma-separated values
      const billsString = billsWithFees.map((bill) => bill.amount).join(", ");
      const originalBillsString = originalBills.map((bill) => bill.amount).join(", ");
      const walletsString = walletsWithBalance
        .map((wallet) => wallet.amount)
        .join(", ");

      setSelectedBills(billsWithFees);
      setSelectedWallets(walletsWithBalance);

      // Set input field values
      setBillsInput(billsString);
      setOriginalBillsInput(originalBillsString);
      setWalletsInput(walletsString);

      toast.success(
        `Loaded ${billsWithFees.length} bills and ${walletsWithBalance.length} wallets`
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load bills and wallets");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedStrategies = async () => {
    try {
      const response = await api.get("/api/bill-optimizer/strategies");
      setSavedStrategies(response.data.strategies || []);
    } catch (error) {
      console.error("Failed to fetch strategies:", error);
    }
  };

  const handleOptimize = async (strategy = "default") => {
    if (!billsInput.trim() || !walletsInput.trim()) {
      toast.error("Please enter bill amounts and wallet balances");
      return;
    }

    setLoading(true);
    try {
      // Parse input values
      const billAmounts = billsInput
        .split(",")
        .map((amount) => parseFloat(amount.trim()))
        .filter((amount) => !isNaN(amount));
      const walletAmounts = walletsInput
        .split(",")
        .map((amount) => parseFloat(amount.trim()))
        .filter((amount) => !isNaN(amount));

      if (billAmounts.length === 0 || walletAmounts.length === 0) {
        toast.error("Please enter valid numbers");
        return;
      }

      // Create bill and wallet objects for API using actual data
      const billsForAPI = billAmounts.map((amount, index) => {
        const originalBill = bills.find((b) => b.amount === amount);
        return {
          id: originalBill?.id || `bill_${index}`,
          serviceNumber: originalBill?.serviceNumber || `SERVICE_${index + 1}`,
          serviceLabel: originalBill?.serviceLabel || `Bill ${index + 1}`,
          amount: amount,
          dueDate: originalBill?.dueDate || new Date(),
        };
      });

      const walletsForAPI = walletAmounts.map((amount, index) => {
        const originalWallet = wallets.find((w) => w.amount === amount);
        return {
          id: originalWallet?.id || `wallet_${index}`,
          label: originalWallet?.label || `Wallet ${index + 1}`,
          amount: amount,
          currency: originalWallet?.currency || "INR",
        };
      });

      const response = await api.post("/api/bill-optimizer/optimize", {
        bills: billsForAPI,
        wallets: walletsForAPI,
        strategy,
        strategyName:
          strategyName || `Optimization ${new Date().toLocaleString()}`,
      });

      setOptimizationResult(response.data);
      toast.success(
        "Optimization completed! You can save the strategy if you like."
      );
    } catch (error) {
      console.error("Optimization failed:", error);
      toast.error("Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (strategyId, strategy = "default") => {
    setLoading(true);
    try {
      const response = await api.post(
        `/api/bill-optimizer/strategies/${strategyId}/recalculate`,
        {
          strategy,
        }
      );

      setOptimizationResult(response.data);
      toast.success("🔄 Strategy recalculated successfully!", {
        duration: 3000,
        icon: "✅",
      });
    } catch (error) {
      console.error("Recalculation failed:", error);
      toast.error("❌ Failed to recalculate strategy", {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStrategy = async (strategyId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this strategy? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/bill-optimizer/strategies/${strategyId}`);
      toast.success("🗑️ Strategy deleted successfully!", {
        duration: 3000,
        icon: "✅",
      });
      fetchSavedStrategies();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("❌ Failed to delete strategy", {
        duration: 4000,
      });
    }
  };

  const loadStrategy = async (strategyId) => {
    try {
      const response = await api.get(
        `/api/bill-optimizer/strategies/${strategyId}`
      );
      const strategy = response.data.strategy;

      setOptimizationResult({
        result: strategy.optimizationResult,
        metrics: {
          totalBillAmount: strategy.totalAmount,
          totalWalletAmount: strategy.totalWalletAmount,
          totalTransactions: strategy.optimizationResult.totalTransactions,
          totalFees: strategy.optimizationResult.totalFees,
          savings: strategy.optimizationResult.savings,
        },
      });

      toast.success("📋 Strategy loaded successfully!", {
        duration: 3000,
        icon: "✅",
      });
    } catch (error) {
      console.error("Failed to load strategy:", error);
      toast.error("❌ Failed to load strategy", {
        duration: 4000,
      });
    }
  };

  // Handle bill checkbox changes
  const handleBillCheckboxChange = (index, checked) => {
    const newCheckedBills = new Set(checkedBills);
    if (checked) {
      newCheckedBills.add(index);
    } else {
      newCheckedBills.delete(index);
    }
    setCheckedBills(newCheckedBills);

    // Update bills input field
    const selectedBillsList = bills.filter((_, i) => newCheckedBills.has(i));
    const billsString = selectedBillsList.map((bill) => bill.amount).join(", ");
    setBillsInput(billsString);
  };

  // Handle wallet checkbox changes
  const handleWalletCheckboxChange = (index, checked) => {
    const newCheckedWallets = new Set(checkedWallets);
    if (checked) {
      newCheckedWallets.add(index);
    } else {
      newCheckedWallets.delete(index);
    }
    setCheckedWallets(newCheckedWallets);

    // Update wallets input field
    const selectedWalletsList = wallets.filter((_, i) =>
      newCheckedWallets.has(i)
    );
    const walletsString = selectedWalletsList
      .map((wallet) => wallet.amount)
      .join(", ");
    setWalletsInput(walletsString);
  };

  // Handle select all bills
  const handleSelectAllBills = (checked) => {
    if (checked) {
      const allBillsSet = new Set(bills.map((_, index) => index));
      setCheckedBills(allBillsSet);
      setAllBillsSelected(true);

      // Update bills input field
      const billsString = bills.map((bill) => bill.amount).join(", ");
      setBillsInput(billsString);
    } else {
      setCheckedBills(new Set());
      setAllBillsSelected(false);
      setBillsInput("");
    }
  };

  // Handle select all wallets
  const handleSelectAllWallets = (checked) => {
    if (checked) {
      const allWalletsSet = new Set(wallets.map((_, index) => index));
      setCheckedWallets(allWalletsSet);
      setAllWalletsSelected(true);

      // Update wallets input field
      const walletsString = wallets.map((wallet) => wallet.amount).join(", ");
      setWalletsInput(walletsString);
    } else {
      setCheckedWallets(new Set());
      setAllWalletsSelected(false);
      setWalletsInput("");
    }
  };

  const toggleBillSelection = (bill) => {
    setSelectedBills((prev) =>
      prev.find((b) => b.id === bill.id)
        ? prev.filter((b) => b.id !== bill.id)
        : [...prev, bill]
    );
  };

  const toggleWalletSelection = (wallet) => {
    setSelectedWallets((prev) =>
      prev.find((w) => w.id === wallet.id)
        ? prev.filter((w) => w.id !== wallet.id)
        : [...prev, wallet]
    );
  };

  const totalBillAmount = billsInput
    ? billsInput
        .split(",")
        .reduce((sum, amount) => sum + (parseFloat(amount.trim()) || 0), 0)
    : 0;
  const totalOriginalBillAmount = originalBillsInput
    ? originalBillsInput
        .split(",")
        .reduce((sum, amount) => sum + (parseFloat(amount.trim()) || 0), 0)
    : 0;
  const totalWalletAmount = walletsInput
    ? walletsInput
        .split(",")
        .reduce((sum, amount) => sum + (parseFloat(amount.trim()) || 0), 0)
    : 0;
  const billCount = billsInput
    ? billsInput.split(",").filter((amount) => amount.trim()).length
    : 0;
  const walletCount = walletsInput
    ? walletsInput.split(",").filter((amount) => amount.trim()).length
    : 0;

  return (
    <div className="container">
      <GlobalHeader />
      <GlobalTabs />
      <SwipeableContent>
        {/* Header with Collapsible Description */}
        <div className={styles.headerSection}>
          <div className={styles.headerTitle}>
            <h3 className={styles.mainHeading}>Bill Payment Strategy</h3>
            <button
              className={styles.infoButton}
              onClick={() => setShowDescription(!showDescription)}
              title={showDescription ? "Hide description" : "Show description"}
            >
              <FiInfo />
            </button>
          </div>

          {showDescription && (
            <div className={styles.aboutContent}>
              <p className={styles.aboutDescription}>
                Welcome to the Bill Payment Optimizer! This tool helps you
                efficiently manage your bills and digital wallet balances.
                Select your bills and wallet balances below, and let the
                optimizer suggest an optimal payment strategy.
              </p>
              <h3>Key Features:</h3>
              <ol>
                <li>
                  <strong>Select Bills & Wallets:</strong> Check/uncheck bills
                  and wallets to include in optimization
                </li>
                <li>
                  <strong>Optimize Payments:</strong> Click "Optimize" to get
                  the best payment strategy
                </li>
                <li>
                  <strong>Save Strategies:</strong> Save results for future
                  reference
                </li>
                <li>
                  <strong>Manual Entry:</strong> Add custom bills like Gas, DTH
                  in the input fields
                </li>
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
              <h3>₹ {totalBillAmount.toLocaleString("en-IN")} (Original: ₹ {totalOriginalBillAmount})</h3>
              <p>{billCount} Bill Amounts</p>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>₹</div>
            <div className={styles.summaryContent}>
              <h3>₹ {totalWalletAmount.toLocaleString("en-IN")}</h3>
              <p>{walletCount} Wallet Balances</p>
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
                <span className={styles.savings}>
                  Save ₹ {optimizationResult.metrics?.savings || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            className="primary"
            onClick={() => handleOptimize("default")}
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

          <button className="muted" onClick={fetchData} disabled={loading}>
            <FiRefreshCcw className={loading ? "spin" : ""} /> Refresh Data
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
            <div className={styles.selectionHeader}>
              <h3>📋 Select Bills to Include</h3>
              <label className={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  checked={allBillsSelected}
                  onChange={(e) => handleSelectAllBills(e.target.checked)}
                />
                <span>Select All</span>
              </label>
            </div>
            <div className={styles.checkboxList}>
              {bills.map((bill, index) => (
                <label key={index} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={checkedBills.has(index)}
                    onChange={(e) =>
                      handleBillCheckboxChange(index, e.target.checked)
                    }
                  />
                  <span className={styles.checkboxLabel}>
                    {bill.serviceLabel} - ₹{bill.amount.toLocaleString("en-IN")}
                    <small>
                      (Original: ₹{bill.originalAmount.toLocaleString("en-IN")})
                    </small>
                  </span>
                </label>
              ))}
              {bills.length === 0 && (
                <p className={styles.noData}>No unpaid bills found</p>
              )}
            </div>
          </div>

          <div className={styles.selectionGroup}>
            <div className={styles.selectionHeader}>
              <h3>💰 Select Wallets to Include</h3>
              <label className={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  checked={allWalletsSelected}
                  onChange={(e) => handleSelectAllWallets(e.target.checked)}
                />
                <span>Select All</span>
              </label>
            </div>
            <div className={styles.checkboxList}>
              {wallets.map((wallet, index) => (
                <label key={index} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={checkedWallets.has(index)}
                    onChange={(e) =>
                      handleWalletCheckboxChange(index, e.target.checked)
                    }
                  />
                  <span className={styles.checkboxLabel}>
                    {wallet.label} - ₹{wallet.amount.toLocaleString("en-IN")}
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
                <div className={styles.fieldHeader}>
                  <label htmlFor="billsInput">Bills (comma-separated)</label>
                  <button
                    type="button"
                    className={styles.infoToggle}
                    onClick={() => setShowBillsInfo(!showBillsInfo)}
                    title={showBillsInfo ? "Hide info" : "Show info"}
                  >
                    <FiInfo />
                  </button>
                </div>
                <textarea
                  id="billsInput"
                  value={billsInput}
                  onChange={(e) =>
                    setBillsInput(
                      e.target.value
                        .replace(/[^0-9,]/g, "")
                        .replace(/(\,,*?)\,,*/g, "$1")
                    )
                  }
                  placeholder="e.g., 1212.13, 856.45, 2341.78"
                  className={styles.textarea}
                  rows={3}
                  required
                />
                {showBillsInfo && (
                  <div className={styles.inputInfo}>
                    <small>
                      💡 Bills include 1% fee + 18% GST on fee. Original
                      amounts:{" "}
                      {bills
                        .map((bill) => `₹${bill.originalAmount}`)
                        .join(", ")}
                    </small>
                  </div>
                )}
              </div>

              <div className={styles.formField}>
                <div className={styles.fieldHeader}>
                  <label htmlFor="walletsInput">
                    Wallet balances (comma-separated)
                  </label>
                  <button
                    type="button"
                    className={styles.infoToggle}
                    onClick={() => setShowWalletsInfo(!showWalletsInfo)}
                    title={showWalletsInfo ? "Hide info" : "Show info"}
                  >
                    <FiInfo />
                  </button>
                </div>
                <textarea
                  id="walletsInput"
                  value={walletsInput}
                  onChange={(e) =>
                    setWalletsInput(
                      e.target.value
                        .replace(/[^0-9,]/g, "")
                        .replace(/(\,,*?)\,,*/g, "$1")
                    )
                  }
                  placeholder="e.g., 5000, 3200, 1500"
                  className={styles.textarea}
                  rows={3}
                  required
                />
                {showWalletsInfo && (
                  <div className={styles.inputInfo}>
                    <small>
                      💡 Only wallets with balance &gt; ₹0 are shown
                    </small>
                  </div>
                )}
              </div>

              <div className={styles.billOptimizerActionButtons}>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={() => handleOptimize("default")}
                  disabled={
                    loading || !billsInput.trim() || !walletsInput.trim()
                  }
                >
                  <FiSettings /> Optimize
                </button>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    setBillsInput("");
                    setWalletsInput("");
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
                  {optimizationResult.result?.strategies?.map(
                    (strategy, index) => (
                      <tr key={index}>
                        <td>{strategy.walletLabel}</td>
                        <td>
                          {strategy.bills.map((bill, billIndex) => (
                            <span key={billIndex}>
                              {bill.serviceLabel} (₹
                              {bill.amount.toLocaleString("en-IN")})
                              {billIndex < strategy.bills.length - 1
                                ? ", "
                                : ""}
                            </span>
                          ))}
                          {strategy.bills.length > 0 && (
                            <span className={styles.totalAmount}>
                              {" "}
                              (Total: ₹
                              {strategy.bills
                                .reduce((sum, bill) => sum + bill.amount, 0)
                                .toLocaleString("en-IN")}
                              )
                            </span>
                          )}
                        </td>
                        <td>
                          ₹ {strategy.remainingAmount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    )
                  )}
                  {optimizationResult.result?.strategies?.length > 0 && (
                    <tr className={styles.totalRow}>
                      <td>
                        Total: ₹
                        {optimizationResult.result.strategies
                          .reduce((sum, s) => sum + s.walletAmount, 0)
                          .toLocaleString("en-IN")}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.saveStrategyButton}
                          onClick={async () => {
                            try {
                              const payload = {
                                strategyName:
                                  strategyName ||
                                  `Optimization ${new Date().toLocaleString()}`,
                                bills: selectedBills.length
                                  ? selectedBills
                                  : bills,
                                wallets: selectedWallets.length
                                  ? selectedWallets
                                  : wallets,
                                optimizationResult: optimizationResult.result,
                              };
                              await api.post(
                                "/api/bill-optimizer/strategies",
                                payload
                              );
                              toast.success("Strategy saved!");
                              fetchSavedStrategies();
                            } catch (e) {
                              console.error("Save strategy failed", e);
                              toast.error("Failed to save strategy");
                            }
                          }}
                        >
                          Save this strategy
                        </button>
                      </td>
                      <td>
                        ₹
                        {optimizationResult.result.strategies
                          .reduce((sum, s) => sum + s.remainingAmount, 0)
                          .toLocaleString("en-IN")}
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
          <div
            className={styles.modalOverlay}
            onClick={() => setShowSavedStrategies(false)}
          >
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
                    {savedStrategies.map((strategy) => (
                      <div
                        key={strategy._id}
                        className={styles.savedStrategyCard}
                      >
                        <div className={styles.strategyInfo}>
                          <h4>{strategy.strategyName}</h4>
                          <p>
                            Created:{" "}
                            {new Date(strategy.createdAt).toLocaleString(
                              "en-IN",
                              {
                                timeZone: "Asia/Kolkata",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }
                            )}
                          </p>
                          <p>
                            Transactions:{" "}
                            {strategy.optimizationResult.totalTransactions} |
                            Savings: ₹ {strategy.optimizationResult.savings}
                          </p>
                        </div>
                        <div className={styles.strategyActions}>
                          <button
                            className="primary"
                            onClick={() => {
                              loadStrategy(strategy._id);
                              setShowSavedStrategies(false);
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
      </SwipeableContent>
    </div>
  );
}
