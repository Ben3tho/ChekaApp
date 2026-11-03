import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  ArrowDownToLine, 
  CheckCircle2, 
  Clock, 
  Coins, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Language } from '../types';
import { useAuth } from '../context/AuthContext';
import { memeAudio } from '../utils/audioSynth';

interface CreatorWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  onOpenBuyCoins?: () => void;
}

export const CreatorWalletModal: React.FC<CreatorWalletModalProps> = ({
  isOpen,
  onClose,
  language = 'sw',
  onOpenBuyCoins,
}) => {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingWithdraw, setSubmittingWithdraw] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [walletSummary, setWalletSummary] = useState<{
    coinsBalance: number;
    creatorEarningsTzs: number;
    totalEarnedTzs: number;
    totalWithdrawnTzs: number;
    pendingPayoutsTzs: number;
  }>({
    coinsBalance: 250,
    creatorEarningsTzs: 35000,
    totalEarnedTzs: 45000,
    totalWithdrawnTzs: 10000,
    pendingPayoutsTzs: 0,
  });

  const [ledger, setLedger] = useState<Array<{
    id: string;
    amount_tzs: number;
    coins: number;
    transaction_type: string;
    status: string;
    reference_code: string;
    description: string;
    created_at: string;
  }>>([]);

  // Withdrawal form inputs
  const [withdrawAmount, setWithdrawAmount] = useState<string>('10000');
  const [operator, setOperator] = useState<string>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState<string>('0754123456');

  const fetchWalletData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const summaryRes = await authFetch('/api/wallet/summary');
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setWalletSummary({
          coinsBalance: data.coinsBalance || 0,
          creatorEarningsTzs: data.creatorEarningsTzs || 0,
          totalEarnedTzs: data.totalEarnedTzs || 0,
          totalWithdrawnTzs: data.totalWithdrawnTzs || 0,
          pendingPayoutsTzs: data.pendingPayoutsTzs || 0,
        });
      }

      const ledgerRes = await authFetch('/api/wallet/ledger');
      if (ledgerRes.ok) {
        const lData = await ledgerRes.json();
        if (Array.isArray(lData.ledger)) {
          setLedger(lData.ledger);
        }
      }
    } catch (err) {
      console.warn('Could not fetch wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWalletData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const amt = Number(withdrawAmount);
    if (!amt || amt < 5000) {
      setErrorMsg(language === 'sw' ? 'Kiwango cha chini cha kutoa ni TZS 5,000' : 'Minimum payout is 5,000 TZS');
      return;
    }

    if (amt > walletSummary.creatorEarningsTzs) {
      setErrorMsg(language === 'sw' ? 'Kiasi kinazidi salio lako linalopatikana' : 'Amount exceeds available balance');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const idempotencyKey = `pout_${user?.id}_${Date.now()}`;
      const res = await authFetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTzs: amt,
          operator,
          phoneNumber,
          idempotencyKey,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErrorMsg(resData.error || 'Imeshindwa kuwasilisha ombi');
      } else {
        setSuccessMsg(resData.message || 'Ombi la kutoa fedha limetumwa kikamilifu!');
        memeAudio.playLaugh();
        fetchWalletData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya mtandao');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{language === 'sw' ? 'Pochi & Mapato ya Cheka' : 'Cheka Wallet & Earnings'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                  LEDGER v2
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                {language === 'sw' ? 'Daftari rasmi la miamala & kutoa fedha' : 'Double-entry wallet & creator payouts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Coins Balance */}
            <div className="bg-neutral-950 border border-amber-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>Sarafu za Cheka (Coins)</span>
              </span>
              <p className="text-2xl font-black text-amber-300 font-mono">
                {walletSummary.coinsBalance.toLocaleString()}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBuyCoins?.();
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] transition-colors"
                >
                  {language === 'sw' ? '+ Ongeza Sarafu' : '+ Buy Coins'}
                </button>
              </div>
            </div>

            {/* Creator Earnings in TZS */}
            <div className="bg-neutral-950 border border-emerald-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Mapato ya Kutoa (TZS)</span>
              </span>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {walletSummary.creatorEarningsTzs.toLocaleString()}
              </p>
              <p className="text-[10px] text-neutral-400 pt-1 font-mono">
                Jumla: TZS {walletSummary.totalEarnedTzs.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                <span>{language === 'sw' ? 'Toa Fedha Kwenda Simu Yako' : 'Withdraw to Mobile Money'}</span>
              </h4>
              <span className="text-[10px] text-neutral-400 font-mono">Min: TZS 5,000</span>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Mtandao wa Simu:</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="mpesa">Vodacom M-Pesa</option>
                    <option value="tigopesa">Tigo Pesa</option>
                    <option value="airtelmoney">Airtel Money</option>
                    <option value="halopesa">HaloPesa</option>
                    <option value="azampay">AzamPay</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Namba ya Simu:</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0754123456"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Kiasi cha Kutoa (TZS):</label>
                <div className="flex gap-2">
                  {[5000, 10000, 20000, 50000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmount(amt.toString())}
                      className={`flex-1 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                        withdrawAmount === amt.toString()
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="5000"
                  step="1000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={submittingWithdraw || walletSummary.creatorEarningsTzs < 5000}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {submittingWithdraw ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="w-4 h-4" />
                )}
                <span>{language === 'sw' ? 'Wasilisha Ombi la Kutoa Fedha' : 'Submit Withdrawal Request'}</span>
              </button>
            </form>
          </div>

          {/* Double-Entry Ledger History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'sw' ? 'Daftari la Miamala (Wallet Ledger)' : 'Transaction Ledger'}</span>
              </h4>
              <button
                type="button"
                onClick={fetchWalletData}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sasisha</span>
              </button>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl divide-y divide-neutral-850 overflow-hidden text-xs">
              {ledger.length === 0 ? (
                <div className="p-6 text-center text-neutral-400">
                  <p>Bado hakuna miamala kwenye daftari lako.</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Zawadi unazopokea au kutoa zitaonekana hapa moja kwa moja.</p>
                </div>
              ) : (
                ledger.slice(0, 5).map(item => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{item.description}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Ref: {item.reference_code} • {new Date(item.created_at).toLocaleDateString('sw-TZ')}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.amount_tzs > 0 ? (
                        <span className="font-mono font-bold text-emerald-400">
                          +TZS {item.amount_tzs.toLocaleString()}
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-amber-400">
                          {item.coins} Coins
                        </span>
                      )}
                      <span className="block text-[9px] uppercase font-bold text-neutral-400">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Terms & Conditions Notice */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <span className="text-neutral-300 font-bold block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Masharti ya Sarafu na Malipo ya Cheka</span>
            </span>
            <p>1 Sarafu ya Cheka = TZS 50. Wachekeshaji wanapokea 70% ya thamani ya kila zawadi. Malipo yanatumwa moja kwa moja kwenda M-Pesa, Tigo Pesa, au Airtel Money.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
