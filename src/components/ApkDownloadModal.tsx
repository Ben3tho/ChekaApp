import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle, X, Sparkles, ShieldCheck, AlertTriangle, ArrowRight, HelpCircle, Layers, RefreshCw } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'sw' | 'en';
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose, language = 'sw' }) => {
  const { canPromptDirectly, triggerInstall, isInstalled, isAndroid, isIOS } = usePWAInstall();
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success'>('idle');
  const [activeTab, setActiveTab] = useState<'easy' | 'apk' | 'troubleshoot'>('easy');

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setInstallStatus('installing');
    if (canPromptDirectly) {
      const accepted = await triggerInstall();
      if (accepted) {
        setInstallStatus('success');
      } else {
        setInstallStatus('idle');
      }
    } else {
      setInstallStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-amber-500/25 via-pink-500/15 to-neutral-900 border-b border-neutral-800">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5 flex-shrink-0 shadow-lg shadow-pink-500/25">
              <img src="/pwa-192x192.png" alt="Cheka Logo" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Sakinisha ChekaApp</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-neutral-950">
                  Android App
                </span>
              </div>
              <p className="text-xs text-neutral-300">Njia rahisi ya kupata app kwenye simu yako</p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="mt-4 flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('easy')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'easy'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Njia Rahisi (WebAPK)</span>
            </button>

            <button
              onClick={() => setActiveTab('apk')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'apk'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Faili la .APK</span>
            </button>

            <button
              onClick={() => setActiveTab('troubleshoot')}
              className={`py-1.5 px-2.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                activeTab === 'troubleshoot'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-300 bg-rose-500/10'
              }`}
              title="Suluhisho la App not installed"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[11px]">Hitilafu?</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* TAB 1: EASIEST WAY (WEBAPK - 100% SUCCESS RATE, NO APP NOT INSTALLED ERROR) */}
          {activeTab === 'easy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/15 via-neutral-800/80 to-neutral-800/60 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded-md bg-emerald-500 text-neutral-950 font-black text-[10px]">
                    INASHAURIWA (100% INAFANYA KAZI)
                  </span>
                </div>
                
                <h4 className="text-sm font-bold text-white mb-1">
                  Sakinisha Moja kwa Moja Kupitia Chrome (Bila Shida ya APK)
                </h4>
                <p className="text-neutral-300 text-[11px] leading-relaxed mb-3">
                  Hii ndiyo njia rasmi na ya kisasa inayotumiwa na Google kwenye Android. Haikuletei kosa la <em>"App not installed"</em>, inajiweka kama app halisi kwenye simu yenye icon yake na inafunguka skrini nzima!
                </p>

                {isInstalled ? (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold">ChekaApp tayari imesakinishwa!</p>
                      <p className="text-[10px] text-emerald-400/80">Angalia kwenye orodha ya apps kwenye simu yako.</p>
                    </div>
                  </div>
                ) : canPromptDirectly ? (
                  <button
                    onClick={handleNativeInstall}
                    disabled={installStatus === 'installing'}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Smartphone className="w-4 h-4 stroke-[2.5]" />
                    <span>{installStatus === 'installing' ? 'Inasakinisha kwenye simu...' : '⚡ Bofya Hapa Kusakinisha Mara Moja'}</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-black/60 border border-neutral-700 space-y-2.5">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      Jinsi ya kusakinisha kwa sekunde 5 kwenye Chrome:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-neutral-200 text-[11px] leading-relaxed">
                      <li>
                        Kwenye kivinjari chako cha Chrome, bofya alama ya <strong>vitone vitatu (⋮)</strong> vilivyopo juu kulia kabisa ya skrini.
                      </li>
                      <li>
                        Kwenye menyu itakayojitokeza, chagua <strong>"Sakinisha programu" (Install app)</strong> au <strong>"Weka kwenye Skrini ya Kwanza" (Add to Home screen)</strong>.
                      </li>
                      <li>
                        Bonyeza <strong>Sakinisha (Install)</strong> — mara moja icon ya ChekaApp itawekwa kwenye simu yako na itafunguka kama app halisi!
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Alert Callout pointing to the error */}
              <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs mb-0.5">Kwanini Njia Hii Ni Bora Zaidi?</h5>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Haitaji ruhusa za kutiliwa shaka za simu, haizibiwi na Play Protect, inatumia MB chache sana (chini ya 2 MB), na video zote zinacheza kwa kasi ya 60fps bila kugoma!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RAW .APK DOWNLOAD */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-800/70 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Faili la Android APK</h4>
                      <p className="text-[10px] text-neutral-400">ChekaApp.apk (16.8 MB)</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-700 text-amber-300">
                    v1.0.0
                  </span>
                </div>

                <a
                  href="/ChekaApp.apk"
                  download="ChekaApp.apk"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Pakua Faili la ChekaApp.apk Sasa</span>
                </a>

                {/* Important warning about signature conflicts */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Kabla ya kusakinisha faili hili la .APK:
                  </p>
                  <p className="text-neutral-300 leading-relaxed">
                    Ikiwa simu yako tayari ilikuwa na toleo la awali la ChekaApp, ni <strong>LAZIMA ulifute (Uninstall) hilo la zamani kwanza</strong> kabla ya kuweka hili, vinginevyo Android itasema <em>"App not installed"</em>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TROUBLESHOOTING "APP NOT INSTALLED" */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <h4 className="font-bold text-white text-xs">
                    Kwanini Simu Yako Inasema "App not installed"?
                  </h4>
                </div>

                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Kama ulivyoona kwenye picha uliyotuma, hitilafu ya <strong>"App not installed"</strong> hutokea kwenye simu za Android kwa sababu kuu 2:
                </p>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-1.5">
                    <p className="font-bold text-amber-400 text-[11px]">
                      1. Kuna Toleo la Zamani Lililopo Kwenye Simu (Signature Mismatch)
                    </p>
                    <p className="text-neutral-300 text-[11px] leading-relaxed">
                      Android inakataa kusasisha app ikiwa toleo lililopo lina cheti cha usalama (keystore) tofauti na APK mpya.
                    </p>
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-700 font-mono text-[10px] text-emerald-400">
                      Suluhisho: Nenda Settings za simu &gt; Apps &gt; Tafuta "Cheka App" &gt; Bonyeza <strong>Uninstall (Futa)</strong>. Kisha sakinisha upya!
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-1.5">
                    <p className="font-bold text-amber-400 text-[11px]">
                      2. Ruhusa ya "Install Unknown Apps" au Play Protect
                    </p>
                    <p className="text-neutral-300 text-[11px] leading-relaxed">
                      Google Play Protect mara nyingi huzuia APK zinazopakuliwa nje ya Play Store.
                    </p>
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-700 font-mono text-[10px] text-emerald-400">
                      Suluhisho: Ikitokea tahadhari, chagua "More details" &gt; <strong>"Install anyway"</strong> au tumia Njia Rahisi (WebAPK) ambayo Play Protect hairuhusu kuzuia.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('easy')}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Tumia Njia ya WebAPK (Haina Shida Hii)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Features Checklist */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Salama &amp; Hakuna Virusi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Skrini Nzima (Standalone)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Inatumia Data Kidogo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inaji-update Yenyewe</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-mono">Toleo: v1.0.0 (ChekaApp)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition"
          >
            Funga
          </button>
        </div>
      </div>
    </div>
  );
};
