import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Play, Square, Globe } from 'lucide-react';

const i18n = {
    vi: {
        title: "Trợ Lý Nổ Máy Khẩn Cấp",
        subtitle: "(Honda / Yamaha Smartkey)",
        placeholder: "Nhập 9 số ID...",
        ready: "SẴN SÀNG",
        readyInst: "Nhập mã xe, đeo tai nghe hoặc mở loa ngoài rồi nhấn BẮT ĐẦU",
        startBtn: "BẮT ĐẦU ĐỌC NHỊP", 
        restartBtn: "LÀM LẠI",
        cancelBtn: "DỪNG KHẨN CẤP",
        alertId: "Mã ID phải bao gồm đúng 9 chữ số!",
        holdKnob: "GIỮ NÚM KHÓA",
        holdInst: "Ấn và giữ chặt núm khóa xe cho đến khi đèn chìa khóa chớp sáng",
        holdSec: "GIỮ NÚM ({i}s)",
        digitX: "SỐ THỨ {i}",
        prepDigit: "Chuẩn bị nhập số: {num}",
        skipZero: "BỎ QUA (Số 0)",
        skipInst: "Tuyệt đối không bấm, chờ đèn xe nháy xác nhận rồi đi tiếp",
        pressX: "BẤM: {j} / {num}",
        pressInst: "Bấm dứt khoát 1 lần ngay khi nghe tiếng 'BÍP'!",
        waitFlash: "ĐỢI ĐÈN NHÁY...",
        waitInst: "Nhìn ổ khóa, đợi đèn trên xe nháy sáng 1 cái là nhận số tiếp theo",
        complete: "HOÀN TẤT!",
        completeInst: "Thành công! Hãy nhấn vào núm khóa 1 lần, vặn lên và nổ máy.",
        cancelInst: "Đã hủy. Bạn có thể làm lại từ đầu.",
        privacy: "An toàn: Mã ID chỉ lưu trên máy bạn, không được gửi đi bất cứ đâu.",
        brand: "Hãng xe:",
        honda: "Honda",
        yamaha: "Yamaha",
        wakeLockErr: "Lưu ý: Trình duyệt không hỗ trợ giữ màn hình sáng."
    },
    en: {
        title: "Emergency Start Assist",
        subtitle: "(Honda / Yamaha Smartkey)",
        placeholder: "Enter 9-digit ID...",
        ready: "READY",
        readyInst: "Enter ID, wear headphones or turn on speaker, then press START",
        startBtn: "START BEEPING", 
        restartBtn: "RESTART",
        cancelBtn: "EMERGENCY STOP",
        alertId: "The ID must contain exactly 9 digits!",
        holdKnob: "HOLD THE KNOB",
        holdInst: "Press and hold the knob until the key indicator light flashes",
        holdSec: "HOLD ({i}s)",
        digitX: "DIGIT {i}",
        prepDigit: "Prepare for digit: {num}",
        skipZero: "SKIP (Digit 0)",
        skipInst: "Do NOT press, wait for the light flash on the vehicle to confirm",
        pressX: "PRESS: {j} / {num}",
        pressInst: "Press firmly once when you hear the 'BEEP'!",
        waitFlash: "WAIT FOR FLASH...",
        waitInst: "Look at the knob, wait for 1 light flash to proceed to next digit",
        complete: "COMPLETE!",
        completeInst: "Success! Press the knob once, turn it on and start the engine.",
        cancelInst: "Cancelled. You can start over.",
        privacy: "Privacy: ID is stored only on this device and is never sent elsewhere.",
        brand: "Brand:",
        honda: "Honda",
        yamaha: "Yamaha",
        wakeLockErr: "Notice: Browser does not support keep-screen-on."
    }
} as const;

type Lang = keyof typeof i18n;
type Brand = 'honda' | 'yamaha';

export default function App() {
  const [lang, setLang] = useState<Lang>('vi');
  const [brand, setBrand] = useState<Brand>('honda');
  const [idInput, setIdInput] = useState('');
  const [showId, setShowId] = useState(false);
  
  const [display, setDisplay] = useState(i18n.vi.ready);
  const [instruction, setInstruction] = useState(i18n.vi.readyInst);
  const [displayColor, setDisplayColor] = useState('text-red-500');
  const [isPulsing, setIsPulsing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const isRunningRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('smartkey_lang') as Lang;
    if (savedLang && i18n[savedLang]) {
      setLang(savedLang);
    }
    const savedId = localStorage.getItem('smartkey_id');
    if (savedId) {
      setIdInput(savedId);
    }
    const savedBrand = localStorage.getItem('smartkey_brand') as Brand;
    if (savedBrand) setBrand(savedBrand);
  }, []);

  useEffect(() => {
    localStorage.setItem('smartkey_lang', lang);
    if (!isRunning) {
      setDisplay(i18n[lang].ready);
      setInstruction(isFinished ? i18n[lang].completeInst : i18n[lang].readyInst);
      if (isFinished) setDisplay(i18n[lang].complete);
    }
  }, [lang, isFinished, isRunning]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && val.length <= 9) {
      setIdInput(val);
      localStorage.setItem('smartkey_id', val);
    }
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.error(`${i18n[lang].wakeLockErr}: ${err}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const playBeep = (type: 'short' | 'long' = 'short') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Create oscillator and gain node
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(type === 'long' ? 600 : 900, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    osc.start();
    
    const duration = type === 'long' ? 0.4 : 0.15;
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const resetUI = (currentLang: Lang) => {
    const t = i18n[currentLang];
    setDisplay(t.ready);
    setDisplayColor("text-red-500");
    setIsPulsing(false);
    setInstruction(t.cancelInst);
    document.body.classList.remove('flash-bg');
    setIsRunning(false);
    isRunningRef.current = false;
    releaseWakeLock();
  };

  const cancelProcess = () => {
    isRunningRef.current = false;
  };

  const startProcess = async () => {
    const id = idInput.trim();
    const t = i18n[lang];

    if (id.length !== 9) {
      alert(t.alertId);
      return;
    }

    localStorage.setItem('smartkey_id', id);
    initAudio();
    await requestWakeLock();

    setIsRunning(true);
    isRunningRef.current = true;
    setIsFinished(false);

    setDisplay(t.holdKnob);
    setDisplayColor('text-red-500');
    setIsPulsing(true);
    setInstruction(t.holdInst);

    // Timing differ for brands: Yamaha activation is usually shorter (trigger only or 5s)
    // We stay safe with 5s as default for both but user can adjust.
    const holdTime = 5; 

    for (let i = holdTime; i > 0; i--) {
      if (!isRunningRef.current) { resetUI(lang); return; }
      setDisplay(t.holdSec.replace('{i}', i.toString()));
      playBeep("short");
      await wait(1000);
    }

    setIsPulsing(false);
    const digits = id.split('');

    for (let index = 0; index < digits.length; index++) {
      if (!isRunningRef.current) { resetUI(lang); return; }

      const num = parseInt(digits[index], 10);

      setDisplayColor("text-blue-500");
      setDisplay(t.digitX.replace('{i}', (index + 1).toString()));
      setInstruction(t.prepDigit.replace('{num}', num.toString()));
      await wait(1000);

      if (!isRunningRef.current) { resetUI(lang); return; }

      if (num === 0) {
        setDisplay(t.skipZero);
        setInstruction(t.skipInst);
        await wait(2500);
      } else {
        setDisplayColor("text-red-500");
        for (let j = 1; j <= num; j++) {
          if (!isRunningRef.current) { resetUI(lang); return; }

          setDisplay(t.pressX.replace('{j}', j.toString()).replace('{num}', num.toString()));
          setInstruction(t.pressInst);
          
          playBeep("long");
          document.body.classList.add('flash-bg');
          if (navigator.vibrate) navigator.vibrate([100]);
          
          await wait(200);
          document.body.classList.remove('flash-bg');
          await wait(600);
        }
      }

      if (!isRunningRef.current) { resetUI(lang); return; }
      setDisplayColor("text-neutral-400");
      setDisplay(t.waitFlash);
      setInstruction(t.waitInst);
      await wait(1500);
    }

    if (isRunningRef.current) {
      setDisplay(t.complete);
      setDisplayColor("text-green-500");
      setInstruction(t.completeInst);
      playBeep("long");
      await wait(200);
      playBeep("long");
      setIsFinished(true);
      setIsRunning(false);
      isRunningRef.current = false;
      releaseWakeLock();
    }
  };

  const t = i18n[lang];

  return (
    <div className="bg-[#1e1e1e] p-6 sm:p-8 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-md w-full mx-4 relative overflow-hidden ring-1 ring-white/10">
      
      {/* Language / Brand Switcher Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{t.brand}</label>
            <div className="flex bg-[#121212] p-1 rounded-lg">
                <button 
                  onClick={() => { setBrand('honda'); localStorage.setItem('smartkey_brand', 'honda'); }}
                  disabled={isRunning}
                  className={`text-[10px] uppercase font-bold py-1 px-3 rounded-md transition-all ${brand === 'honda' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-500'}`}
                >
                  {t.honda}
                </button>
                <button 
                  onClick={() => { setBrand('yamaha'); localStorage.setItem('smartkey_brand', 'yamaha'); }}
                  disabled={isRunning}
                  className={`text-[10px] uppercase font-bold py-1 px-3 rounded-md transition-all ${brand === 'yamaha' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-500'}`}
                >
                  {t.yamaha}
                </button>
            </div>
        </div>

        <div className="relative">
            <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Lang)}
                disabled={isRunning}
                className="bg-[#121212] text-white border-2 border-neutral-800 py-1.5 pl-7 pr-3 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50 appearance-none cursor-pointer"
            >
                <option value="vi">🇻🇳 VN</option>
                <option value="en">🇬🇧 EN</option>
            </select>
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">{t.title}</h1>
        <p className="text-neutral-400 text-xs mb-8">{t.subtitle}</p>
        
        <div className="relative mb-8 group">
          <input 
            type={showId ? "tel" : "password"}
            value={idInput}
            onChange={handleIdChange}
            placeholder={t.placeholder}
            disabled={isRunning}
            maxLength={9}
            inputMode="numeric"
            autoComplete="off"
            className="w-full bg-[#121212] border-2 border-neutral-800 rounded-2xl py-5 px-6 text-2xl text-center text-white tracking-[0.3em] font-mono outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-neutral-700"
          />
          <button 
            type="button"
            onClick={() => setShowId(!showId)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-white transition-colors"
            title="Toggle Visibility"
            tabIndex={-1}
          >
            {showId ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        <div className={`text-3xl sm:text-4xl font-black mb-4 min-h-[5rem] flex items-center justify-center uppercase tracking-wide ${displayColor} ${isPulsing ? 'pulse' : ''} transition-colors duration-300`}>
          {display}
        </div>
        
        <div className="text-neutral-400 text-base sm:text-lg min-h-[4rem] mb-8 leading-relaxed px-2">
          {instruction}
        </div>
        
        <div className="flex flex-col gap-3">
          {!isRunning ? (
            <button 
              onClick={startProcess}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              {isFinished ? t.restartBtn : t.startBtn}
            </button>
          ) : (
            <button 
              onClick={cancelProcess}
              className="w-full bg-transparent border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 text-red-500 font-bold text-lg py-4 px-6 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5 fill-current" />
              {t.cancelBtn}
            </button>
          )}
        </div>

        <p className="mt-8 text-[10px] text-neutral-600 font-medium px-4">
            {t.privacy}
        </p>
      </div>
    </div>
  );
}
