
import React, { useState, useRef, useEffect } from 'react';
import { CompanyInfo, AdContent, HistoryItem } from './types';
import { generateAdContent, generateAIImage } from './services/geminiService';

const APP_NAME = "Long Thanh Đào Luxury";
const APP_SLOGAN = "Chuyên Gia Content AI Triệu View";
const VERSION = "2.0.5"; 

const WRITING_STYLES = [
  { id: 'pro', name: 'Sang trọng & Chuyên nghiệp', description: 'Ngôn từ đẳng cấp, lịch sự' },
  { id: 'funny', name: 'Mặn mòi & Lầy lội (Viral)', description: 'Gen Z slang, bao muối, cực dính' },
  { id: 'short', name: 'Ngắn gọn & Chốt đơn', description: 'Tập trung vào giá và hành động' },
  { id: 'story', name: 'Kể chuyện (Storytelling)', description: 'Chạm tới cảm xúc khách hàng' },
];

const LOADING_STEPS = [
  "Đang pha muối vào Content...",
  "AI đang vận công viết lách...",
  "Đang 'vẩy' thêm icon lầy lội...",
  "Tối ưu hóa khả năng chốt đơn...",
  "Xong rồi! Check hàng thôi anh em!"
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showKeyWarning, setShowKeyWarning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<string>("");
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('ltd_theme') as 'dark' | 'light') || 'dark');
  
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>(WRITING_STYLES[1].name);

  const [bannerImage, setBannerImage] = useState<string>(() => localStorage.getItem('ltd_banner') || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop");
  const [bannerHeight, setBannerHeight] = useState<number>(() => parseInt(localStorage.getItem('ltd_banner_height') || '256'));
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('long_thanh_dao_info');
    return saved ? JSON.parse(saved) : { 
      name: 'Long Thanh Đào Luxury', 
      hotline: '088642345', 
      address: '217 Hoàng Quốc Việt, Lào Cai' 
    };
  });
  
  const [logoImage, setLogoImage] = useState<string | null>(() => localStorage.getItem('ltd_logo'));
  const [logoOpacity, setLogoOpacity] = useState<number>(() => parseFloat(localStorage.getItem('ltd_logo_opacity') || '0.8'));
  const [productImage, setProductImage] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<AdContent | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('long_thanh_dao_history');
    return saved ? JSON.parse(saved) : [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('long_thanh_dao_info', JSON.stringify(companyInfo));
    localStorage.setItem('ltd_banner', bannerImage);
    localStorage.setItem('ltd_banner_height', bannerHeight.toString());
    localStorage.setItem('ltd_theme', theme);
    localStorage.setItem('ltd_logo_opacity', logoOpacity.toString());
    if (logoImage) localStorage.setItem('ltd_logo', logoImage);
  }, [companyInfo, bannerImage, bannerHeight, logoImage, theme, logoOpacity]);

  useEffect(() => {
    localStorage.setItem('long_thanh_dao_history', JSON.stringify(history));
  }, [history]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!productImage && !userPrompt) return alert("Bác phải cho AI biết sản phẩm là gì chứ? Tải ảnh hoặc viết mô tả đi ạ!");
    
    setIsGenerating(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const step = Math.floor(prev / 20);
        setLoadingText(LOADING_STEPS[Math.min(step, LOADING_STEPS.length - 1)]);
        if (prev >= 96) return prev;
        return prev + Math.random() * 8;
      });
    }, 300);

    try {
      let finalImage = productImage;
      if (!productImage && userPrompt) {
        finalImage = await generateAIImage(userPrompt);
        setProductImage(finalImage);
      }

      const content = await generateAdContent(finalImage!, companyInfo, selectedStyle, userPrompt);
      setGeneratedContent(content);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        productImage: finalImage!,
        companyName: companyInfo.name,
        content: content
      };
      setHistory(prev => [newItem, ...prev]);
      setProgress(100);
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error(err);
      if (err.message === "MISSING_API_KEY") {
        setShowKeyWarning(true);
      } else {
        alert("AI đang bị 'say lúa' hoặc nghẽn mạng. Bác thử lại lần nữa nhé!");
      }
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setIsGenerating(false), 800);
    }
  };

  const isDark = theme === 'dark';

  const KeyWarningModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-10">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-red-500/30 rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-8 animate-fadeIn">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Bác đã thêm Key nhưng chưa kích hoạt!</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Key đã nằm trong Vercel rồi. Bây giờ bác chỉ cần thực hiện bước cuối cùng này thôi.
          </p>
        </div>
        <div className="bg-white/5 rounded-2xl p-6 space-y-3 border border-white/5 text-left">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center mb-2">Bước cuối cùng (Cực quan trọng):</p>
          <ul className="text-xs text-slate-300 space-y-4 list-decimal list-inside">
            <li>Vào tab <b>Deployments</b> (Triển khai) trên Vercel.</li>
            <li>Tìm bản cập nhật mới nhất ở trên cùng (chỗ bác vừa thấy lỗi đỏ).</li>
            <li>Bấm vào dấu <b>3 chấm (...)</b> bên phải bản đó.</li>
            <li>Chọn <b>Redeploy</b> (Triển khai lại).</li>
            <li>Đợi nó chạy xong 100% là máy sẽ tự nạp mã API mới bác vừa lưu!</li>
          </ul>
        </div>
        <button onClick={() => setShowKeyWarning(false)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-xl shadow-indigo-600/20">OK, ĐỂ EM ĐI REDEPLOY LẦN CUỐI!</button>
      </div>
    </div>
  );

  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl animate-fadeIn p-8">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
              className="text-indigo-500 transition-all duration-300 ease-out"
              strokeDasharray={377}
              strokeDashoffset={377 - (377 * progress) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black text-white">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">{loadingText}</h2>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col lg:flex-row overflow-hidden font-['Plus_Jakarta_Sans'] ${isDark ? 'bg-[#050505] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      {isGenerating && <LoadingOverlay />}
      {showKeyWarning && <KeyWarningModal />}

      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex w-72 border-r flex-col p-8 space-y-10 z-50 transition-colors ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xl shadow-indigo-500/20">L</div>
          <div>
            <h1 className="text-base font-black tracking-tighter uppercase">Long Thanh</h1>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">v{VERSION}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black transition-all ${activeTab === 'home' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>TRANG CHỦ</button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>LỊCH SỬ</button>
          <div className="pt-6 border-t border-current opacity-5"></div>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5">
            <span>{isDark ? 'CHẾ ĐỘ SÁNG' : 'CHẾ ĐỘ TỐI'}</span>
            <div className={`w-8 h-4 rounded-full relative ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isDark ? 'left-0.5' : 'left-4.5'}`}></div>
            </div>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative pb-28 lg:pb-10 custom-scrollbar">
        {/* Banner */}
        <div className="relative w-full cursor-pointer group overflow-hidden transition-all duration-500 shadow-2xl" style={{ height: `${bannerHeight}px` }}>
          <img src={bannerImage} className="w-full h-full object-cover brightness-[0.3] transition-transform duration-[2s] group-hover:scale-110" alt="Banner" style={{ imageRendering: 'auto' }} />
          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#050505]' : 'from-slate-50'} to-transparent opacity-80`}></div>
          <div className="absolute bottom-6 left-6 md:left-12 text-shadow-lg">
            <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-white">{APP_NAME}</h2>
            <p className="text-indigo-400 font-black text-[9px] md:text-[11px] uppercase tracking-[0.4em] mt-2">{APP_SLOGAN}</p>
          </div>
          <button onClick={() => bannerInputRef.current?.click()} className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white hover:bg-white/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
        </div>

        <div className="px-4 md:px-10 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-10">
          <div className="xl:col-span-5 space-y-6">
            {/* Thương hiệu Card */}
            <div className={`p-6 rounded-[2rem] shadow-xl ${isDark ? 'glass' : 'bg-white border border-slate-100'}`}>
              <h3 className="text-xs font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span> THƯƠNG HIỆU
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Tên Shop / Công ty", key: "name", placeholder: "Tên hiển thị..." },
                  { label: "Hotline Chốt Đơn", key: "hotline", placeholder: "088..." },
                  { label: "Địa Chỉ", key: "address", placeholder: "Khu vực..." }
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{field.label}</label>
                    <input
                      type="text"
                      value={(companyInfo as any)[field.key]}
                      onChange={(e) => setCompanyInfo(p => ({...p, [field.key]: e.target.value}))}
                      className={`w-full px-5 py-3 border rounded-xl outline-none transition-all text-sm font-bold ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 space-y-6">
                <div>
                  <div className="flex justify-between text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                    <span>Chiều cao Banner</span>
                    <span className="text-indigo-500">{bannerHeight}px</span>
                  </div>
                  <input type="range" min="150" max="500" value={bannerHeight} onChange={e => setBannerHeight(parseInt(e.target.value))} className="w-full h-1 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
                <div className="flex items-center gap-6">
                  <div onClick={() => logoInputRef.current?.click()} className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden shadow-lg ${isDark ? 'bg-white/5 border-white/10 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-500'}`}>
                    {logoImage ? <img src={logoImage} className="w-full h-full object-cover" style={{ imageRendering: 'auto' }} /> : <span className="text-xl">+</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                      <span>Độ mờ Logo</span>
                      <span className="text-indigo-500">{Math.round(logoOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={logoOpacity} onChange={e => setLogoOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt Card */}
            <div className={`p-6 rounded-[2rem] shadow-xl ${isDark ? 'glass' : 'bg-white border border-slate-100'}`}>
              <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded-full"></span> LỜI NHẮC MẶN MÒI
              </h3>
              <textarea 
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Ví dụ: Sim Tam Hoa 888 giá cực hời, bao sang tên, người chơi hệ phong thủy..."
                className={`w-full h-32 px-5 py-4 border rounded-2xl outline-none transition-all text-sm font-bold resize-none ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'}`}
              />
            </div>

            {/* Phong Cách Card */}
            <div className={`p-6 rounded-[2rem] shadow-xl ${isDark ? 'glass' : 'bg-white border border-slate-100'}`}>
              <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-purple-500 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span> PHONG CÁCH VIẾT
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {WRITING_STYLES.map((style) => (
                  <button key={style.id} onClick={() => setSelectedStyle(style.name)} className={`text-left px-5 py-3 rounded-xl border transition-all ${selectedStyle === style.name ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : isDark ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    <div className="text-[11px] font-black uppercase tracking-tight">{style.name}</div>
                    <div className={`text-[9px] ${selectedStyle === style.name ? 'text-indigo-100' : 'text-slate-500'}`}>{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ảnh Sản Phẩm Card */}
            <div className={`p-6 rounded-[2rem] shadow-xl ${isDark ? 'glass' : 'bg-white border border-slate-100'}`}>
              <h3 className="text-xs font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span> ẢNH QUẢNG CÁO
              </h3>
              <div onClick={() => fileInputRef.current?.click()} className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${isDark ? 'bg-white/5 border-white/10 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-500'}`}>
                {productImage ? <img src={productImage} className="w-full h-full object-cover" style={{ imageRendering: 'auto' }} /> : (
                  <div className="text-center opacity-20">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    <p className="text-[10px] font-black uppercase tracking-widest">Tải Ảnh Sản Phẩm</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-5 rounded-2xl font-black text-white tracking-[0.2em] text-sm shadow-2xl active:scale-95 transition-all ${isGenerating ? 'bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-500 hover:neon-glow'}`}>
              {isGenerating ? "AI ĐANG VẮT MUỐI..." : "BẮT ĐẦU SÁNG TẠO TRIỆU VIEW"}
            </button>
          </div>

          <div id="results-section" className="xl:col-span-7 space-y-8">
             {/* Preview Card */}
             <div className={`p-3 md:p-4 rounded-[2.5rem] shadow-2xl relative ${isDark ? 'glass' : 'bg-white border border-slate-100'}`}>
              <div className="absolute top-8 left-8 z-20 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> BẢN NHÁY QUẢNG CÁO
              </div>
              
              <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-[#0a0a0a] shadow-inner ring-1 ring-white/5">
                {productImage ? (
                  <>
                    <img 
                      src={productImage} 
                      className="w-full h-full object-cover select-none" 
                      style={{ 
                        imageRendering: 'auto',
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden'
                      }} 
                      alt="Ad Preview" 
                    />
                    
                    {logoImage && (
                      <div 
                        className="absolute top-6 right-6 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-[6px] border-white/10 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all transform hover:scale-105" 
                        style={{ 
                          opacity: logoOpacity,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img 
                          src={logoImage} 
                          className="w-full h-full object-cover" 
                          style={{ imageRendering: 'auto' }}
                          alt="Logo"
                        />
                      </div>
                    )}
                    
                    <div className="absolute bottom-6 left-6 right-6 p-6 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-md -z-10"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent -z-10"></div>
                      
                      <div className="relative flex flex-col items-start gap-1">
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] opacity-90">{companyInfo.name}</span>
                        <h4 className="text-white text-3xl md:text-4xl font-black tracking-tighter leading-none">{companyInfo.hotline}</h4>
                        <div className="flex items-center gap-2 mt-2 opacity-50">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          <p className="text-white text-[9px] md:text-[10px] uppercase font-black tracking-widest line-clamp-1">{companyInfo.address}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 p-10 text-center animate-pulse">
                     <svg className="w-24 h-24 mb-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                     <p className="font-black text-sm uppercase tracking-[0.4em]">Đang đợi bác lên ý tưởng...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Content Output Card */}
            <div className={`p-8 rounded-[2.5rem] shadow-2xl min-h-[500px] ${isDark ? 'glass' : 'bg-white border border-slate-100'}`}>
              <h3 className="text-xs font-black mb-8 uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span> CONTENT AI "VẮT MUỐI"
              </h3>
              {generatedContent ? (
                <div className="space-y-8 animate-fadeIn">
                  <div className="p-6 rounded-3xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5">
                    <p className={`font-black text-2xl md:text-3xl leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{generatedContent.headline}</p>
                  </div>
                  <p className={`leading-relaxed font-bold text-base md:text-lg whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{generatedContent.body}</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.hashtags.map(tag => (
                      <span key={tag} className="text-[10px] font-black px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        #{tag.replace(/^#+/, '')}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => {
                      const text = `${generatedContent.headline}\n\n${generatedContent.body}\n\n${generatedContent.hashtags.map(t => `#${t.replace(/^#+/, '')}`).join(' ')}`;
                      navigator.clipboard.writeText(text);
                      alert("Đã sao chép Content 'mặn mòi' thành công!");
                    }} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black tracking-widest shadow-xl transition-all active:scale-95">
                    SAO CHÉP TOÀN BỘ BÀI VIẾT
                  </button>
                </div>
              ) : (
                 <div className="h-48 flex flex-col items-center justify-center opacity-10 text-center">
                   <p className="text-[10px] font-black uppercase tracking-[0.6em]">Chưa có bài viết mới</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className={`fixed bottom-0 w-full h-20 backdrop-blur-3xl border-t flex lg:hidden justify-around items-center safe-bottom z-50 transition-all ${isDark ? 'bg-[#0a0a0a]/90 border-white/5' : 'bg-white/95 border-slate-200'}`}>
        <button onClick={() => setActiveTab('home')} className={`p-4 text-[10px] font-black uppercase tracking-[0.2em] ${activeTab === 'home' ? 'text-indigo-500' : 'text-slate-400'}`}>HOME</button>
        <button onClick={handleGenerate} className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white -translate-y-8 shadow-2xl border-4 border-[#050505] active:scale-90 transition-transform">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
        </button>
        <button onClick={() => setActiveTab('history')} className={`p-4 text-[10px] font-black uppercase tracking-[0.2em] ${activeTab === 'history' ? 'text-indigo-500' : 'text-slate-400'}`}>LỊCH SỬ</button>
      </nav>

      <input type="file" hidden ref={logoInputRef} onChange={e => handleFileChange(e, setLogoImage)} />
      <input type="file" hidden ref={fileInputRef} onChange={e => handleFileChange(e, setProductImage)} />
      <input type="file" hidden ref={bannerInputRef} onChange={(e) => handleFileChange(e, setBannerImage)} />
    </div>
  );
};

export default App;
