import React, { useState } from 'react';
import { X, Coins, ShieldCheck, CheckCircle2, Loader2, Sparkles, AlertCircle, ArrowRight, Phone, Receipt, Info } from 'lucide-react';
import { memeAudio } from '../utils/audioSynth';

interface BuyCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  onSuccess: (newCoins: number) => void;
  language?: 'sw' | 'en';
}

interface PackageOption {
  id: string;
  name: string;
  swahiliName: string;
  tzs: number;
  coins: number;
  bonus: number;
  icon: string;
  popular?: boolean;
}

const PACKAGES: PackageOption[] = [
  { id: 'chai', name: 'Chai Pack', swahiliName: 'Kifurushi cha Chai', tzs: 1000, coins: 100, bonus: 0, icon: '☕' },
  { id: 'sambusa', name: 'Sambusa Pack', swahiliName: 'Kifurushi cha Sambusa', tzs: 2500, coins: 300, bonus: 50, icon: '🥟', popular: true },
  { id: 'nyamachoma', name: 'Nyama Choma', swahiliName: 'Kifurushi cha Nyama Choma', tzs: 5000, coins: 700, bonus: 150, icon: '🥩' },
  { id: 'vip', name: 'VIP Boss Pack', swahiliName: 'Kifurushi cha VIP Boss', tzs: 10000, coins: 1600, bonus: 400, icon: '👑' },
];

const OPERATORS = [
  { id: 'vodacom', name: 'Vodacom M-Pesa', color: 'from-rose-600 to-red-700', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30', prefix: '074, 075, 076' },
  { id: 'tigo', name: 'Tigo Pesa', color: 'from-blue-600 to-indigo-700', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30', prefix: '065, 067, 071' },
  { id: 'airtel', name: 'Airtel Money', color: 'from-red-600 to-amber-600', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30', prefix: '068, 069, 078' },
  { id: 'halotel', name: 'HaloPesa', color: 'from-orange-500 to-amber-600', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30', prefix: '062' },
  { id: 'azampesa', name: 'AzamPesa', color: 'from-cyan-600 to-blue-700', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', prefix: '077, 073' },
];

export const BuyCoinsModal: React.FC<BuyCoinsModalProps> = ({
  isOpen,
  onClose,
  userCoins,
  onSuccess,
  language = 'sw',
}) => {
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>(PACKAGES[1]);
  const [selectedOperator, setSelectedOperator] = useState<string>('vodacom');
  const [phoneNumber, setPhoneNumber] = useState<string>('0754123456');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ussdStep, setUssdStep] = useState<'idle' | 'prompt' | 'success'>('idle');
  const [receipt, setReceipt] = useState<{ reference: string; amount: number; coins: number; operator: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeveloperInfo, setShowDeveloperInfo] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(val);
    setErrorMessage(null);

    // Auto-detect operator
    if (val.startsWith('074') || val.startsWith('075') || val.startsWith('076')) {
      setSelectedOperator('vodacom');
    } else if (val.startsWith('065') || val.startsWith('067') || val.startsWith('071')) {
      setSelectedOperator('tigo');
    } else if (val.startsWith('068') || val.startsWith('069') || val.startsWith('078')) {
      setSelectedOperator('airtel');
    } else if (val.startsWith('062')) {
      setSelectedOperator('halotel');
    } else if (val.startsWith('077') || val.startsWith('073')) {
      setSelectedOperator('azampesa');
    }
  };

  const handleInitiatePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage(language === 'sw' ? 'Tafadhali weka namba sahihi ya simu (mfano 0754123456)' : 'Please enter a valid phone number');
      memeAudio.playBoing();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setUssdStep('prompt');
    memeAudio.playPop();

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTzs: selectedPackage.tzs,
          coins: selectedPackage.coins + selectedPackage.bonus,
          rawPhone: phoneNumber,
          operator: selectedOperator,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        if (response.status === 429) {
          throw new Error('Mifumo ya malipo inalinda muamala wako. Tafadhali subiri sekunde chache kisha ubonyeze tena.');
        }
        throw new Error(data.error || 'Malipo yameshindwa kukamilika, tafadhali jaribu tena.');
      }

      // Simulate network USSD response delay (1.8s) for smooth UX
      setTimeout(() => {
        setIsLoading(false);
        setUssdStep('success');
        setReceipt({
          reference: data.referenceCode,
          amount: data.amountTzs,
          coins: data.coinsCredited,
          operator: data.operatorName,
        });

        memeAudio.playVictory();
        onSuccess(data.coinsCredited);
      }, 1800);
    } catch (err: any) {
      setIsLoading(false);
      setUssdStep('idle');
      setErrorMessage(err.message || 'Hitilafu ya malipo, jaribu tena.');
      memeAudio.playBoing();
    }
  };

  const handleReset = () => {
    setUssdStep('idle');
    setReceipt(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-neutral-950 font-bold shadow-lg shadow-amber-500/20">
              <Coins className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                {language === 'sw' ? 'Nunua Sarafu za Cheka' : 'Buy Cheka Coins'}
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  TZS
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                {language === 'sw' ? `Salio lako la sasa: ${userCoins} Sarafu` : `Current balance: ${userCoins} Coins`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {ussdStep === 'prompt' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
              <div className="relative w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Phone className="w-9 h-9 text-amber-400 animate-bounce" />
                <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-bold text-white">
                  {language === 'sw' ? 'Ombi la Malipo Limerushwa Simuni' : 'Payment Push Sent to Phone'}
                </h3>
                <p className="text-xs text-neutral-300">
                  {language === 'sw'
                    ? `Tafadhali kagua simu yako (${phoneNumber}) kisha weka namba yako ya siri (PIN) kukamilisha malipo ya TZS ${selectedPackage.tzs.toLocaleString()}.`
                    : `Please check your phone (${phoneNumber}) and enter your PIN to approve TZS ${selectedPackage.tzs.toLocaleString()}.`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Inasubiri uthibitisho wa mtandao...</span>
              </div>
            </div>
          )}

          {ussdStep === 'success' && receipt && (
            <div className="py-4 space-y-4 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {language === 'sw' ? 'Hongera! Malipo Yamethibitishwa 🎉' : 'Payment Successful! 🎉'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {language === 'sw'
                    ? `Umeongezewa Sarafu ${receipt.coins.toLocaleString()} kwenye akaunti yako kikamilifu.`
                    : `Successfully credited ${receipt.coins.toLocaleString()} coins to your account.`}
                </p>
              </div>

              {/* Digital Receipt Card */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-400 pb-2 border-b border-neutral-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    Kumbukumbu ya Muamala
                  </span>
                  <span className="font-mono text-neutral-200">{receipt.reference}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Mtandao:</span>
                  <span className="font-semibold text-white">{receipt.operator}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Aina ya Muamala:</span>
                  <span className="font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    🧪 Majaribio ya Sandbox (Hakuna pesa iliyokatwa)
                  </span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Kiasi:</span>
                  <span className="font-bold text-amber-400">TZS {receipt.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Sarafu Zilizoongezwa:</span>
                  <span className="font-bold text-emerald-400">+{receipt.coins.toLocaleString()} 🪙</span>
                </div>
                <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                  ℹ️ <strong className="text-neutral-300">Kwanini hujaweka PIN?</strong> Mfumo upo kwenye <em>AzamPay Sandbox (Mazingira ya Majaribio)</em>. Kwenye Sandbox, fedha halisi hazikatwi kutoka kwenye SIM card yako ili kukuruhusu kufanya majaribio bila gharama.
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-bold hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
              >
                {language === 'sw' ? 'Tumia Sarafu Zako Kwenye Vicheko' : 'Done & Continue'}
              </button>
            </div>
          )}

          {/* Sandbox Notice Banner */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs">
            <span className="text-base">🧪</span>
            <div className="space-y-0.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>Mazingira ya Majaribio (Sandbox Mode)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-mono">AZAMPAY TEST</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Huu ni muunganisho wa majaribio wa AzamPay. <strong className="text-neutral-200">Hakuna pesa halisi inayokatwa</strong> kwenye salio lako la Airtel Money/M-Pesa, na namba ya siri (PIN) haihitajiki kwenye hatua hii ya majaribio.
              </p>
            </div>
          </div>

          {ussdStep === 'idle' && (
            <>
              {/* Package Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  1. {language === 'sw' ? 'Chagua Kifurushi cha Sarafu' : 'Select Coin Bundle'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {PACKAGES.map((pkg) => {
                    const isSelected = selectedPackage.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          setSelectedPackage(pkg);
                          memeAudio.playBoing();
                        }}
                        className={`relative p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-[9px] font-bold text-white shadow-xs">
                            INAPENDWA SANA 🔥
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-lg mb-1">
                          <span>{pkg.icon}</span>
                          <span className="font-bold text-white text-sm">
                            {(pkg.coins + pkg.bonus).toLocaleString()} 🪙
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-amber-400">
                          TZS {pkg.tzs.toLocaleString()}
                        </div>
                        {pkg.bonus > 0 && (
                          <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                            +{pkg.bonus} Bonus ya Bure
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Network Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  2. {language === 'sw' ? 'Mtandao wa Malipo (Tanzania)' : 'Payment Network'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OPERATORS.map((op) => {
                    const isSelected = selectedOperator === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => {
                          setSelectedOperator(op.id);
                          memeAudio.playPop();
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-neutral-800 border-amber-400/80 shadow-xs'
                            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{op.name}</div>
                        <div className="text-[9px] text-neutral-400 mt-0.5">{op.prefix}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  3. {language === 'sw' ? 'Namba ya Simu itakayolipa' : 'Phone Number'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-mono font-bold">
                    🇹🇿 +255
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="0754 123 456"
                    className="w-full pl-20 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:outline-hidden text-sm text-white font-mono placeholder-neutral-600 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Ujumbe wa USSD utatokea papo hapo kwenye kioo cha simu yako kuweka PIN.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Pay Action Button */}
              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-bold hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inarusha ombi la USSD...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {language === 'sw'
                        ? `Lipa TZS ${selectedPackage.tzs.toLocaleString()} kwa Simu`
                        : `Pay TZS ${selectedPackage.tzs.toLocaleString()} via Mobile`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Integration Information Notice */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Imelindwa na Usimbaji wa Kibenki (256-bit)
                </span>
                <button
                  type="button"
                  onClick={() => setShowDeveloperInfo(!showDeveloperInfo)}
                  className="text-amber-400 hover:underline flex items-center gap-0.5"
                >
                  <Info className="w-3 h-3" />
                  {showDeveloperInfo ? 'Ficha Info' : 'Taarifa za Gateway'}
                </button>
              </div>

              {showDeveloperInfo && (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 space-y-1.5 animate-fade-in">
                  <p className="font-semibold text-amber-300">Taarifa ya Kuunganisha Gateway ya Moja kwa Moja:</p>
                  <p>
                    Mfumo unatumia muundo sanifu wa Push USSD (STK Prompt). Ukiwa tayari kuweka akaunti ya biashara (Merchant):
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-neutral-400">
                    <li><strong>AzamPay:</strong> Weka `AZAMPAY_APP_NAME` na `AZAMPAY_CLIENT_SECRET`.</li>
                    <li><strong>Selcom / DPO:</strong> Weka `SELCOM_API_KEY` na `SELCOM_VENDOR_ID`.</li>
                    <li>Njia zote ziko tayari kwenye `server.ts` kupokea Webhook ya kuthibitisha papo hapo.</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
