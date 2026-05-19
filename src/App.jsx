import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════
//  CONSTANTS & PURE HELPERS
// ═══════════════════════════════════════════════════
const CATS = [
  'Food',
  'Travel',
  'Bills',
  'Shopping',
  'Entertainment',
  'Health',
  'Groceries',
  'Other',
];
const ESSENTIAL = new Set(['Bills', 'Health', 'Groceries']);
const EMOJI = {
  Food: '🍛',
  Travel: '🚗',
  Bills: '📋',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Health: '💊',
  Groceries: '🛒',
  Other: '📦',
};
const CATCOL = {
  Food: '#f97316',
  Travel: '#8b5cf6',
  Bills: '#64748b',
  Shopping: '#ec4899',
  Entertainment: '#a855f7',
  Health: '#10b981',
  Groceries: '#22c55e',
  Other: '#64748b',
};

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

const todayStr = () => new Date().toISOString().split('T')[0];
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getSassy = (pct) => {
  if (pct <= 0)
    return {
      msg: 'Budget has LEFT THE CHAT. 💀 Your wallet needs CPR and a priest.',
      e: '☠️',
      c: '#ef4444',
    };
  if (pct < 10)
    return {
      msg: '🚨 MAYDAY MAYDAY. Step away from Swiggy. I repeat, step AWAY from Swiggy.',
      e: '🚨',
      c: '#ef4444',
    };
  if (pct < 20)
    return {
      msg: 'Dangerously close to broke. Rice at home. Atta at home. Dignity? Also at home.',
      e: '😬',
      c: '#f97316',
    };
  if (pct < 35)
    return {
      msg: "Your wallet is SWEATING. Tell your friends you're on a 'spiritual fast' this weekend.",
      e: '😅',
      c: '#eab308',
    };
  if (pct < 50)
    return {
      msg: 'Halfway through the money. How far into the month are we? That math better be mathing.',
      e: '🤔',
      c: '#eab308',
    };
  if (pct < 65)
    return {
      msg: "Schrödinger's Budget™ — simultaneously fine and not fine. We observe and we worry.",
      e: '😐',
      c: '#84cc16',
    };
  if (pct < 80)
    return {
      msg: 'Surprisingly responsible! Your CA would almost be proud of you. Almost.',
      e: '😌',
      c: '#22c55e',
    };
  return {
    msg: "Financial LEGEND status activated. SIPs? Index funds? Are you Zerodha's golden child?",
    e: '🤑',
    c: '#10b981',
  };
};

const calcStreak = (expenses) => {
  const nonEssentialDays = new Set(
    expenses.filter((e) => !ESSENTIAL.has(e.category)).map((e) => e.date)
  );
  let n = 0,
    d = new Date();
  while (n < 366) {
    if (nonEssentialDays.has(d.toISOString().split('T')[0])) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
};

const fmtTimer = (ms) => {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    s
  ).padStart(2, '0')}`;
};

const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const sanitizeImportedExpenses = (items) =>
  Array.isArray(items)
    ? items
        .filter((e) => e && e.title && e.date && Number(e.amount) >= 0)
        .map((e) => ({
          id: e.id || uid(),
          title: String(e.title),
          date: String(e.date),
          amount: Number(e.amount),
          category: CATS.includes(e.category) ? e.category : 'Other',
        }))
    : [];

const sanitizeImportedImpulse = (items) =>
  Array.isArray(items)
    ? items
        .filter((i) => i && i.title)
        .map((i) => ({
          id: i.id || uid(),
          title: String(i.title),
          amount: Number(i.amount) || 0,
          addedAt: Number(i.addedAt) || Date.now(),
        }))
    : [];

// ═══════════════════════════════════════════════════
//  PERSISTENT STORAGE (window.storage API)
// ═══════════════════════════════════════════════════
//const store = {
// get: async (k) => { try { const r = await window.storage.get(k); return r?.value ?? null; } catch { return null; } },
//set: async (k, v) => { try { await window.storage.set(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {} },
// del: async (k) => { try { await window.storage.delete(k); } catch {} },
//};

const store = {
  get: async (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: async (k, v) => {
    try {
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    } catch {
      // ignore storage errors
    }
  },
  del: async (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore storage errors
    }
  },
};

// ═══════════════════════════════════════════════════
//  SHARED STYLE TOKENS
// ═══════════════════════════════════════════════════
const BG = '#0b0b13';
const CARD = '#12121f';
const CARD2 = '#0f0f1a';
const BORDER = 'rgba(148,163,184,0.08)';
const AMBER = '#f59e0b';
const inp = {
  width: '100%',
  background: CARD2,
  border: `1px solid rgba(148,163,184,0.12)`,
  color: '#f1f5f9',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

// ═══════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════
function Toast({ toast }) {
  if (!toast) return null;
  const isSave = toast.type === 'save';
  const isInfo = toast.type === 'info';
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '12px 18px',
        borderRadius: '12px',
        maxWidth: '320px',
        fontSize: '0.85rem',
        fontWeight: 600,
        lineHeight: 1.4,
        background: isSave ? '#064e3b' : isInfo ? '#1e2433' : '#181828',
        border: `1px solid ${
          isSave ? '#10b98155' : isInfo ? '#33445566' : '#f59e0b33'
        }`,
        color: isSave ? '#a7f3d0' : isInfo ? '#94a3b8' : '#fde68a',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        animation: 'slideInToast .25s ease',
      }}
    >
      {toast.msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  LOGIN SCREEN
// ═══════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const ok = name.trim().length > 0;
  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          animation: 'fadeUp .55s ease both',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              display: 'flex',
              alignItems: compact ? 'flex-start' : 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#000',
              boxShadow: '0 8px 32px #f59e0b44',
            }}
          >
            ₹
          </div>
          <h1
            style={{
              fontSize: '2.6rem',
              fontWeight: 800,
              letterSpacing: '-2px',
              lineHeight: 1.1,
              background: 'linear-gradient(135deg,#f8fafc 40%,#64748b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px',
            }}
          >
            Paisa Tracker
          </h1>
          <p
            style={{
              color: '#475569',
              fontSize: '0.875rem',
              fontStyle: 'italic',
            }}
          >
            Because your money deserves better than a Notepad file.
          </p>
        </div>
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: 32,
          }}
        >
          <label
            style={{
              display: 'block',
              color: '#475569',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            WHO ARE YOU?
          </label>
          <input
            style={{
              ...inp,
              marginBottom: 12,
              fontSize: '1rem',
              padding: '13px 16px',
            }}
            placeholder="Your name (e.g. Rahul, Priya...)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ok && onLogin(name.trim())}
          />
          <button
            onClick={() => ok && onLogin(name.trim())}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '13px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: ok ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'all .2s',
              background: ok
                ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                : '#1e293b',
              color: ok ? '#000' : '#475569',
              boxShadow: ok ? '0 4px 20px #f59e0b33' : 'none',
            }}
          >
            Enter the App →
          </button>
        </div>
        <p
          style={{
            textAlign: 'center',
            color: '#1e2a3a',
            fontSize: '0.72rem',
            marginTop: 14,
          }}
        >
          No signup. No server. 100% on your device.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  ONBOARDING SCREEN
// ═══════════════════════════════════════════════════
function OnboardingScreen({ username, onSalary }) {
  const [amt, setAmt] = useState('');
  const num = Number(amt);
  const ok = num > 0 && !isNaN(num);
  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          animation: 'fadeUp .55s ease both',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p
            style={{
              color: AMBER,
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: 8,
            }}
          >
            Welcome, {username}! 🎉
          </p>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-1px',
              color: '#f1f5f9',
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            What's your monthly budget?
          </h2>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>
            Salary, stipend, allowance — no judgment whatsoever.
          </p>
        </div>
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: compact ? 'flex-start' : 'center',
              gap: 10,
              marginBottom: ok ? 6 : 16,
            }}
          >
            <span
              style={{
                color: AMBER,
                fontFamily: 'monospace',
                fontSize: '1.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              ₹
            </span>
            <input
              type="number"
              min="0"
              style={{
                ...inp,
                fontSize: '1.2rem',
                padding: '13px 14px',
                fontFamily: 'monospace',
              }}
              placeholder="e.g. 50000"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ok && onSalary(num)}
            />
          </div>
          {ok && (
            <p
              style={{
                color: AMBER,
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                textAlign: 'right',
                marginBottom: 14,
                opacity: 0.8,
              }}
            >
              = {fmt(num)} / month
            </p>
          )}
          <button
            onClick={() => ok && onSalary(num)}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '13px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: ok ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'all .2s',
              background: ok
                ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                : '#1e293b',
              color: ok ? '#000' : '#475569',
              boxShadow: ok ? '0 4px 20px #f59e0b33' : 'none',
            }}
          >
            Let's Track It 🎯
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  EXPENSE FORM
// ═══════════════════════════════════════════════════
function ExpenseForm({ onAdd, compact }) {
  const [form, setForm] = useState({
    date: todayStr(),
    amount: '',
    title: '',
    category: 'Food',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.amount || !form.title || !form.date) return;
    onAdd({ ...form, amount: Number(form.amount) });
    setForm({ date: todayStr(), amount: '', title: '', category: 'Food' });
  };
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h3
        style={{
          color: '#f1f5f9',
          fontWeight: 700,
          fontSize: '0.95rem',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>📝</span> Log an Expense
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '1fr 1fr',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              color: '#475569',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            DATE
          </label>
          <input
            type="date"
            style={inp}
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              color: '#475569',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            AMOUNT (₹)
          </label>
          <input
            type="number"
            min="0"
            style={{ ...inp, fontFamily: 'monospace' }}
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '1fr 1fr',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              color: '#475569',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            TITLE
          </label>
          <input
            style={inp}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Swiggy order"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              color: '#475569',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            CATEGORY
          </label>
          <select
            style={{ ...inp, cursor: 'pointer' }}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {CATS.map((c) => (
              <option key={c} value={c} style={{ background: CARD2 }}>
                {EMOJI[c]} {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={submit}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg,#f59e0b,#d97706)',
          color: '#000',
          border: 'none',
          borderRadius: 10,
          padding: '12px',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 4px 16px #f59e0b22',
        }}
      >
        + Log Expense
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  EXPENSE LIST
// ═══════════════════════════════════════════════════
function ExpenseList({ expenses, onDelete }) {
  if (!expenses.length)
    return (
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <p style={{ color: '#475569', fontSize: '0.875rem' }}>
          No expenses yet. Either very disciplined or very forgetful.
        </p>
      </div>
    );

  const grouped = expenses.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h3
        style={{
          color: '#f1f5f9',
          fontWeight: 700,
          fontSize: '0.95rem',
          marginBottom: 16,
        }}
      >
        📚 Expense History
      </h3>
      <div
        style={{
          maxHeight: 480,
          overflowY: 'auto',
          paddingRight: 4,
          display: 'grid',
          gap: 16,
        }}
      >
        {sortedDates.map((date) => {
          const dayTotal = grouped[date].reduce(
            (s, e) => s + Number(e.amount),
            0
          );
          const d = new Date(date + 'T00:00:00');
          const label = d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
          return (
            <div key={date}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: compact ? 'flex-start' : 'center',
                  marginBottom: 8,
                  paddingBottom: 6,
                  borderBottom: '1px solid rgba(148,163,184,0.07)',
                }}
              >
                <span
                  style={{
                    color: '#64748b',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    color: '#f97316',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {fmt(dayTotal)}
                </span>
              </div>
              {grouped[date].map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    alignItems: compact ? 'flex-start' : 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(148,163,184,0.04)',
                    animation: 'fadeUp .2s ease',
                  }}
                >
                  <span
                    style={{ fontSize: 16, minWidth: 24, textAlign: 'center' }}
                  >
                    {EMOJI[e.category] || '📦'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: '#e2e8f0',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {e.title}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: compact ? 'flex-start' : 'center',
                        gap: 6,
                        marginTop: 1,
                      }}
                    >
                      <span
                        style={{
                          color: CATCOL[e.category] || '#64748b',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '1px 7px',
                          borderRadius: 20,
                          background: (CATCOL[e.category] || '#64748b') + '18',
                        }}
                      >
                        {e.category}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      color: '#f97316',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fmt(e.amount)}
                  </div>
                  <button
                    onClick={() => onDelete(e.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ef444433',
                      color: '#ef4444',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      flexShrink: 0,
                      transition: 'all .15s',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  IMPULSE VAULT FORM
// ═══════════════════════════════════════════════════
function ImpulseForm({ onAdd, compact }) {
  const [form, setForm] = useState({ title: '', amount: '' });
  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ title: form.title.trim(), amount: Number(form.amount) || 0 });
    setForm({ title: '', amount: '' });
  };
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <h3
          style={{
            color: '#f1f5f9',
            fontWeight: 700,
            fontSize: '0.95rem',
            marginBottom: 4,
          }}
        >
          🔒 Add to Impulse Vault
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>
          Log what you <em>want</em> but don't need. Wait 24 hours. Still want
          it? Only then, buy it.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '1fr 130px',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <input
          style={inp}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="What do you 'need'? 🤔"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              color: AMBER,
              fontFamily: 'monospace',
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            ₹
          </span>
          <input
            type="number"
            min="0"
            style={{ ...inp, fontFamily: 'monospace', paddingLeft: 10 }}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Cost?"
          />
        </div>
      </div>
      <button
        onClick={submit}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '12px',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 4px 16px #7c3aed22',
        }}
      >
        🔒 Lock It in the Vault
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  IMPULSE VAULT LIST (live countdown)
// ═══════════════════════════════════════════════════
function ImpulseList({ items, onPurchase, onSkip }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!items.length)
    return (
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏦</div>
        <p style={{ color: '#475569', fontSize: '0.875rem' }}>
          Vault is empty. For now. We both know that won't last.
        </p>
      </div>
    );

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h3
        style={{
          color: '#f1f5f9',
          fontWeight: 700,
          fontSize: '0.95rem',
          marginBottom: 16,
        }}
      >
        🏦 Vault Contents ({items.length})
      </h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => {
          const msLeft = item.addedAt + 86400000 - (now || item.addedAt);
          const locked = msLeft > 0;
          const countdown = fmtTimer(msLeft);
          const pctLeft = locked ? (msLeft / 86400000) * 100 : 0;
          const urgency =
            pctLeft < 10 ? '#ef4444' : pctLeft < 33 ? '#f97316' : '#8b5cf6';
          return (
            <div
              key={item.id}
              style={{
                background: CARD2,
                border: `1px solid ${
                  locked ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.3)'
                }`,
                borderRadius: 12,
                padding: 16,
                boxShadow: locked ? 'none' : '0 0 24px rgba(245,158,11,0.07)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      color: '#e2e8f0',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      marginBottom: item.amount > 0 ? 4 : 0,
                    }}
                  >
                    {item.title}
                  </div>
                  {item.amount > 0 && (
                    <div
                      style={{
                        color: AMBER,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {fmt(item.amount)}
                    </div>
                  )}
                  <div
                    style={{
                      color: '#475569',
                      fontSize: '0.68rem',
                      marginTop: 4,
                    }}
                  >
                    Added{' '}
                    {new Date(item.addedAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div
                  style={{
                    padding: '5px 11px',
                    borderRadius: 8,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: locked ? urgency + '18' : '#10b98118',
                    border: `1px solid ${
                      locked ? urgency + '44' : '#10b98144'
                    }`,
                    color: locked ? urgency : '#10b981',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {locked ? countdown : 'UNLOCKED!'}
                </div>
              </div>

              {locked && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      height: 4,
                      background: '#1a1a2e',
                      borderRadius: 2,
                      overflow: 'hidden',
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 2,
                        width: `${pctLeft}%`,
                        background: `linear-gradient(90deg,${urgency},${urgency}aa)`,
                        transition: 'width 1s linear',
                      }}
                    />
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.65rem' }}>
                    {Math.round(pctLeft)}% cooldown remaining — impulse cooling
                    down...
                  </div>
                </div>
              )}

              {!locked && (
                <div
                  style={{
                    background: '#f59e0b11',
                    border: '1px solid #f59e0b22',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 10,
                    color: '#fde68a',
                    fontSize: '0.78rem',
                    lineHeight: 1.4,
                  }}
                >
                  ⏰ 24 hours have passed. Do you <em>still</em> want this, or
                  is your past self embarrassed for you?
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: compact ? '100%' : 'auto' }}>
                <button
                  onClick={() => !locked && onPurchase(item.id)}
                  disabled={locked}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    border: 'none',
                    background: locked
                      ? '#1e293b'
                      : 'linear-gradient(135deg,#f59e0b,#d97706)',
                    color: locked ? '#475569' : '#000',
                    opacity: locked ? 0.5 : 1,
                    transition: 'all .2s',
                  }}
                >
                  {locked ? '🔒 Locked' : '✓ Mark as Purchased'}
                </button>
                <button
                  onClick={() => onSkip(item.id)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: '1px solid #10b98133',
                    color: '#10b981',
                    fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                >
                  💰 Skip & Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MAIN TRACKER APP SHELL
// ═══════════════════════════════════════════════════
function TrackerApp({
  username,
  salary,
  expenses,
  impulse,
  onAddExpense,
  onDeleteExpense,
  onAddImpulse,
  onPurchaseImpulse,
  onSkipImpulse,
  onReset,
  onChangeSalary,
  onExportData,
  onImportData,
}) {
  const [tab, setTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [editingSalary, setEditingSalary] = useState(false);
  const [newSalary, setNewSalary] = useState('');

  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 720 : false
  );

  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 720);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = salary - totalSpent;
  const pct =
    salary > 0 ? Math.max(0, Math.min(100, (remaining / salary) * 100)) : 100;
  const streak = calcStreak(expenses);
  const sassy = salary > 0 ? getSassy(pct) : null;
  const barColor = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
  const usedPct = Math.min(100, Math.round(100 - pct));

  const handleAddExpense = async (exp) => {
    await onAddExpense(exp);
    showToast(`Logged ${fmt(exp.amount)} for "${exp.title}"`);
  };
  const handleDeleteExpense = async (id) => {
    await onDeleteExpense(id);
    showToast('Expense removed', 'info');
  };
  const handleAddImpulse = async (item) => {
    await onAddImpulse(item);
    showToast('Locked in the vault! Think it over 🔒');
  };
  const handleSkipImpulse = async (id) => {
    const item = impulse.find((i) => i.id === id);
    await onSkipImpulse(id);
    showToast(
      `💰 Money saved! You resisted ${item ? fmt(item.amount) : 'a purchase'}`,
      'save'
    );
  };
  const handlePurchaseImpulse = async (id) => {
    await onPurchaseImpulse(id);
    showToast('Added as expense 🛍️', 'info');
  };
  const handleSalaryEdit = async () => {
    const n = Number(newSalary);
    if (n > 0) {
      await onChangeSalary(n);
      setEditingSalary(false);
      setNewSalary('');
      showToast(`Budget updated to ${fmt(n)}`);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        color: '#f1f5f9',
        fontFamily: 'inherit',
      }}
    >
      <Toast toast={toast} />
      <div
        style={{ maxWidth: 800, margin: '0 auto', padding: compact ? '12px 12px 70px' : '16px 16px 80px' }}
      >
        {/* ── Header ─────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: compact ? 'flex-start' : 'center',
            paddingTop: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                color: AMBER,
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
              }}
            >
              PAISA TRACKER
            </div>
            <div
              style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}
            >
              Hey, {username} 👋
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={onExportData}
              style={{
                background: 'transparent',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#10b981',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Export Backup
            </button>
            <label
              style={{
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Import Backup
              <input
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportData(file);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              onClick={onReset}
              style={{
                background: 'transparent',
                border: '1px solid rgba(148,163,184,0.12)',
                color: '#64748b',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reset App
            </button>
          </div>
        </div>

        {/* ── Sassy Banner ──────────────────────── */}
        {sassy && (
          <div
            style={{
              background: CARD,
              border: `1px solid ${sassy.c}33`,
              borderRadius: 14,
              padding: '13px 18px',
              marginBottom: 20,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>
              {sassy.e}
            </span>
            <span
              style={{
                color: '#94a3b8',
                fontSize: '0.875rem',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              {sassy.msg}
            </span>
          </div>
        )}

        {/* ── Metric Cards ──────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: compact ? '1fr' : 'repeat(3,1fr)',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {/* Budget */}
          <div
            onClick={() => setEditingSalary((v) => !v)}
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'border .2s',
            }}
            title="Click to edit budget"
          >
            <div
              style={{
                color: '#475569',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              MONTHLY BUDGET
            </div>
            <div
              style={{
                color: '#94a3b8',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '1.05rem',
                letterSpacing: '-0.5px',
              }}
            >
              {fmt(salary)}
            </div>
            <div
              style={{ color: '#334155', fontSize: '0.62rem', marginTop: 4 }}
            >
              tap to edit ✎
            </div>
          </div>
          {/* Spent */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                color: '#475569',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              TOTAL SPENT
            </div>
            <div
              style={{
                color: '#f97316',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '1.05rem',
                letterSpacing: '-0.5px',
              }}
            >
              {fmt(totalSpent)}
            </div>
            <div
              style={{ color: '#475569', fontSize: '0.62rem', marginTop: 4 }}
            >
              {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
            </div>
          </div>
          {/* Remaining */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${
                (remaining < 0 ? '#ef4444' : barColor) + '44'
              }`,
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: `0 4px 20px ${remaining < 0 ? '#ef4444' : barColor}18`,
            }}
          >
            <div
              style={{
                color: '#475569',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              REMAINING
            </div>
            <div
              style={{
                color: remaining < 0 ? '#ef4444' : barColor,
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '1.05rem',
                letterSpacing: '-0.5px',
              }}
            >
              {fmt(remaining)}
            </div>
            <div
              style={{
                color: remaining < 0 ? '#ef444466' : '#47556966',
                fontSize: '0.62rem',
                marginTop: 4,
              }}
            >
              {remaining < 0 ? 'over budget!' : `${Math.round(pct)}% left`}
            </div>
          </div>
        </div>

        {/* ── Salary Edit Inline ─────────────────── */}
        {editingSalary && (
          <div
            style={{
              background: '#12121f',
              border: `1px solid ${AMBER}33`,
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 12,
              display: 'flex',
              gap: 10,
              alignItems: compact ? 'flex-start' : 'center',
              animation: 'fadeUp .2s ease',
            }}
          >
            <span
              style={{
                color: AMBER,
                fontFamily: 'monospace',
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              ₹
            </span>
            <input
              type="number"
              min="0"
              style={{
                ...inp,
                flex: 1,
                fontFamily: 'monospace',
                padding: '8px 12px',
              }}
              placeholder={`Current: ${salary}`}
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSalaryEdit()}
              autoFocus
            />
            <button
              onClick={handleSalaryEdit}
              style={{
                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              Update
            </button>
            <button
              onClick={() => setEditingSalary(false)}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#64748b',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Progress Bar ──────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                color: '#475569',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              BUDGET CONSUMED
            </span>
            <span
              style={{
                color: barColor,
                fontSize: '0.68rem',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {usedPct}% used
            </span>
          </div>
          <div
            style={{
              height: 7,
              background: '#1a1a2e',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 4,
                width: `${usedPct}%`,
                background:
                  barColor === '#10b981'
                    ? 'linear-gradient(90deg,#059669,#34d399)'
                    : barColor === '#f59e0b'
                    ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                    : 'linear-gradient(90deg,#dc2626,#f97316)',
                transition: 'width .6s ease',
              }}
            />
          </div>
        </div>

        {/* ── Tabs + Streak ─────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: compact ? 'flex-start' : 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: compact ? '100%' : 'auto' }}>
            {['dashboard', 'impulse'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  border: `1px solid ${
                    tab === t ? '#f59e0b55' : 'rgba(148,163,184,0.12)'
                  }`,
                  background: tab === t ? '#f59e0b18' : 'transparent',
                  color: tab === t ? AMBER : '#64748b',
                  fontFamily: 'inherit',
                  position: 'relative',
                  transition: 'all .2s',
                }}
              >
                {t === 'dashboard' ? '📊 Dashboard' : '🔒 Impulse Vault'}
                {t === 'impulse' && impulse.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -7,
                      right: -7,
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: compact ? 'flex-start' : 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                    }}
                  >
                    {impulse.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* No-Spend Streak */}
          <div
            style={{
              background: streak > 0 ? '#064e3b33' : '#1e2433',
              border: `1px solid ${streak > 0 ? '#10b98133' : '#334155'}`,
              borderRadius: 10,
              padding: '6px 14px',
              display: 'flex',
              alignItems: compact ? 'flex-start' : 'center',
              gap: 7,
            }}
          >
            <span style={{ fontSize: 14 }}>{streak > 0 ? '🔥' : '💤'}</span>
            <div>
              <div
                style={{
                  color: streak > 0 ? '#6ee7b7' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {streak} day{streak !== 1 ? 's' : ''} clean
              </div>
              <div
                style={{
                  color: streak > 0 ? '#065f46' : '#1e293b',
                  fontSize: '0.62rem',
                }}
              >
                no-spend streak
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Content ───────────────────────── */}
        {tab === 'dashboard' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <ExpenseForm onAdd={handleAddExpense} compact={compact} />
            <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
          </div>
        )}
        {tab === 'impulse' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <ImpulseForm onAdd={handleAddImpulse} compact={compact} />
            <ImpulseList
              items={impulse}
              onPurchase={handlePurchaseImpulse}
              onSkip={handleSkipImpulse}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  ROOT APP — STATE + PERSISTENCE
// ═══════════════════════════════════════════════════
export default function PaisaTracker() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState('login');
  const [username, setUsername] = useState('');
  const [salary, setSalary] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [impulse, setImpulse] = useState([]);

  useEffect(() => {
    // Inject fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap';
    document.head.appendChild(link);

    // Inject keyframes
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
      ::-webkit-scrollbar { width:4px; }
      ::-webkit-scrollbar-track { background:#0b0b13; }
      ::-webkit-scrollbar-thumb { background:#f59e0b33; border-radius:2px; }
      @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideInToast { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
      input[type=date]::-webkit-calendar-picker-indicator { filter:invert(.4); cursor:pointer; }
      input[type=number] { -moz-appearance:textfield; }
      input[type=number]::-webkit-outer-spin-button,
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
      select option { background:#0f0f1a; color:#f1f5f9; }
    `;
    document.head.appendChild(style);

    // Load persisted data
    (async () => {
      const u = await store.get('paisa_user');
      const s = await store.get('paisa_salary');
      const e = await store.get('paisa_expenses');
      const im = await store.get('paisa_impulse');
      if (u) setUsername(u);
      if (s) setSalary(Number(s));
      if (e)
        try {
          setExpenses(JSON.parse(e));
        } catch {
      // ignore storage errors
    }
      if (im)
        try {
          setImpulse(JSON.parse(im));
        } catch {
      // ignore storage errors
    }
      if (u && s) setScreen('app');
      else if (u) setScreen('onboarding');
      setReady(true);
    })();
  }, []);

  const handleLogin = async (name) => {
    setUsername(name);
    await store.set('paisa_user', name);
    const s = await store.get('paisa_salary');
    if (s) {
      setSalary(Number(s));
      setScreen('app');
    } else setScreen('onboarding');
  };

  const handleSalary = async (amount) => {
    setSalary(amount);
    await store.set('paisa_salary', String(amount));
    setScreen('app');
  };

  const addExpense = async (exp) => {
    const updated = [{ ...exp, id: uid() }, ...expenses];
    setExpenses(updated);
    await store.set('paisa_expenses', updated);
  };

  const deleteExpense = async (id) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    await store.set('paisa_expenses', updated);
  };

  const addImpulse = async (item) => {
    const updated = [{ ...item, id: uid(), addedAt: Date.now() }, ...impulse];
    setImpulse(updated);
    await store.set('paisa_impulse', updated);
  };

  const purchaseImpulse = async (id) => {
    const item = impulse.find((i) => i.id === id);
    const updImpulse = impulse.filter((i) => i.id !== id);
    setImpulse(updImpulse);
    await store.set('paisa_impulse', updImpulse);
    if (item && item.amount > 0) {
      const newExp = {
        id: uid(),
        date: todayStr(),
        amount: item.amount,
        title: item.title,
        category: 'Shopping',
      };
      const updExp = [newExp, ...expenses];
      setExpenses(updExp);
      await store.set('paisa_expenses', updExp);
    }
  };

  const skipImpulse = async (id) => {
    const updated = impulse.filter((i) => i.id !== id);
    setImpulse(updated);
    await store.set('paisa_impulse', updated);
  };

  const exportData = () => {
    downloadJson(`paisa-backup-${todayStr()}.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      username,
      salary,
      expenses,
      impulse,
    });
  };

  const importData = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const nextUser = typeof parsed.username === 'string' ? parsed.username.trim() : '';
      const nextSalary = Number(parsed.salary) > 0 ? Number(parsed.salary) : 0;
      const nextExpenses = sanitizeImportedExpenses(parsed.expenses);
      const nextImpulse = sanitizeImportedImpulse(parsed.impulse);

      if (nextUser) {
        setUsername(nextUser);
        await store.set('paisa_user', nextUser);
      }
      if (nextSalary > 0) {
        setSalary(nextSalary);
        await store.set('paisa_salary', String(nextSalary));
      }

      setExpenses(nextExpenses);
      setImpulse(nextImpulse);
      await store.set('paisa_expenses', nextExpenses);
      await store.set('paisa_impulse', nextImpulse);

      if (nextUser && nextSalary > 0) setScreen('app');
      else if (nextUser) setScreen('onboarding');
    } catch {
      alert('Invalid backup file. Please import a valid Paisa backup JSON.');
    }
  };

  const resetAll = async () => {
    await store.del('paisa_user');
    await store.del('paisa_salary');
    await store.del('paisa_expenses');
    await store.del('paisa_impulse');
    setUsername('');
    setSalary(0);
    setExpenses([]);
    setImpulse([]);
    setScreen('login');
  };

  if (!ready)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0b0b13',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f59e0b',
          fontFamily: 'monospace',
          fontSize: '1rem',
          letterSpacing: '2px',
        }}
      >
        LOADING...
      </div>
    );

  if (screen === 'login') return <LoginScreen onLogin={handleLogin} />;
  if (screen === 'onboarding')
    return <OnboardingScreen username={username} onSalary={handleSalary} />;

  return (
    <TrackerApp
      username={username}
      salary={salary}
      expenses={expenses}
      impulse={impulse}
      onAddExpense={addExpense}
      onDeleteExpense={deleteExpense}
      onAddImpulse={addImpulse}
      onPurchaseImpulse={purchaseImpulse}
      onSkipImpulse={skipImpulse}
      onReset={resetAll}
      onChangeSalary={handleSalary}
      onExportData={exportData}
      onImportData={importData}
    />
  );
}
