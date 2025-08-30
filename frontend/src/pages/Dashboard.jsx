import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiRefreshCcw } from "react-icons/fi";
import HeaderAvatar from "../components/HeaderAvatar";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "../shared/SortableItem";
import { useAccounts } from "../store/useAccounts";
import { useBalances } from "../store/useBalances";
import { useAuth } from "../store/useAuth";
import { useSettings } from "../store/useSettings";
import AccountCard from "../components/AccountCard";
import AddAccountModal from "../components/AddAccountModal";
import RefreshProgress from "../components/RefreshProgress";
import Loader from "../components/Loader";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { accounts, fetchAccounts, addAccount, deleteAccount } = useAccounts();
  const { refreshing, progress, refreshOne, refreshAll } = useBalances();
  const { baseCurrency, exchangeRates, fetchSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  useEffect(() => {
    fetchAccounts();
    fetchSettings();
  }, []);

  const total = useMemo(() => {
    const byCurrency = accounts.reduce((acc, a) => {
      const cur = a.lastCurrency || "INR";
      acc[cur] = (acc[cur] || 0) + (a.lastBalance || 0);
      return acc;
    }, {});
    return byCurrency;
  }, [accounts]);

  const baseTotal = useMemo(() => {
    // exchangeRates map: currency -> rate relative to base (1.0 for base)
    // amount_in_base = amount_in_currency / rate
    return Object.entries(total).reduce((sum, [cur, amount]) => {
      if (cur === baseCurrency) return sum + amount;
      const rate = exchangeRates?.[cur];
      if (!rate || rate <= 0) return sum;
      return sum + amount / rate;
    }, 0);
  }, [total, baseCurrency, exchangeRates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        (a.label || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q)
    );
  }, [accounts, query]);

  const sortedFiltered = useMemo(() => {
    if (sortBy === "amount") {
      return [...filtered].sort(
        (a, b) => (b.lastBalance || 0) - (a.lastBalance || 0)
      );
    }
    return filtered;
  }, [filtered, sortBy]);

  return (
    <div className="container">
      <header className="topbar">
        <h3>Amazon Wallet Monitor</h3>
        <div className="spacer" />
        <HeaderAvatar />
      </header>

      <div className="action-buttons">
        <button
          className="muted"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <FiPlus /> Add account
        </button>
        <button
          className="primary"
          onClick={async () => {
            await refreshAll(accounts);
            await fetchAccounts();
          }}
        >
          <FiRefreshCcw /> Refresh All
        </button>
      </div>

      <section className="totals">
        {Object.entries(total).map(([cur, amount]) => (
          <div className="pill" key={cur}>
            Total {cur === "INR" ? "₹" : cur} {Number(amount).toLocaleString("en-IN")}
          </div>
        ))}
      </section>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          margin: "4px 0 8px",
        }}
      >
        <input
          placeholder="Search accounts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="order">Order</option>
          <option value="amount">Amount</option>
        </select>
      </div>

      {!accounts.length ? (
        <Loader text="Loading accounts…" />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={async ({ active, over }) => {
            if (!over || active.id === over.id) return;
            const list = sortedFiltered;
            const oldIndex = list.findIndex((x) => x.id === active.id);
            const newIndex = list.findIndex((x) => x.id === over.id);
            const moved = arrayMove(list, oldIndex, newIndex);
            const payload = moved.map((a, idx) => ({
              id: a.id,
              order: Date.now() + idx,
            }));
            const api = (await import("../api/client")).default;
            await api.post("/accounts/reorder", { items: payload });
            await fetchAccounts();
          }}
        >
          <SortableContext
            items={sortedFiltered.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <section className="grid">
              {sortedFiltered.map((a) => (
                <SortableItem id={a.id} key={a.id}>
                  {(dragHandleProps) => (
                    <div {...dragHandleProps}>
                      <AccountCard
                        account={a}
                        onRefresh={async () => {
                          await refreshOne(a.id);
                          await fetchAccounts();
                        }}
                        onEdit={() => {
                          setEditing(a);
                          setOpen(true);
                        }}
                        onDelete={async () => {
                          await deleteAccount(a.id);
                          await fetchAccounts();
                        }}
                      />
                    </div>
                  )}
                </SortableItem>
              ))}
            </section>
          </SortableContext>
        </DndContext>
      )}

      <AddAccountModal
        open={open}
        initial={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={async (payload) => {
          if (editing) {
            const { label, email, password, region } = payload;
            const update = { label, email, region };
            if (password) update.password = password;
            await (await import("../store/useAccounts")).useAccounts
              .getState()
              .updateAccount(editing.id, update);
          } else {
            await addAccount(payload);
          }
          await fetchAccounts();
          setOpen(false);
          setEditing(null);
        }}
      />
      <RefreshProgress refreshing={refreshing} progress={progress} />
    </div>
  );
}
