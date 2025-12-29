
import React, { useState, useRef, useEffect } from 'react';
import { CompanyInfo, AdContent, HistoryItem } from './types';
import { generateAdContent, generateAIImage } from './services/geminiService';

const APP_NAME = "Long Thanh Đào";
const APP_SLOGAN = "Chuyên Gia Content AI Triệu View";
const VERSION = "2.1.7"; 

const WRITING_STYLES = [
  { id: 'pro', name: 'Sang trọng & Chuyên nghiệp', description: 'Ngôn từ đẳng cấp, lịch sự' },
  { id: 'funny', name: 'Mặn mòi & Lầy lội (Viral)', description: 'Gen Z slang, bao muối, cực dính' },
  { id: 'short', name: 'Ngắn gọn & Chốt đơn', description: 'Tập trung vào giá và hành động' },
  { id: 'story', name: 'Kể chuyện (Storytelling)', description: 'Chạm tới cảm xúc khách hàng' },
];

const LOADING_STEPS = [
  { main: "Thiết lập máy chủ AI...", sub: "Đang kết nối tới trung tâm xử lý Long Thanh Đào v2.1.7" },
  { main: "Phân tích sản phẩm...", sub: "Đang trích xuất đặc tính nổi bật từ hình ảnh" },
  { main: "Dát vàng ngôn từ...", sub: "Đang tinh chỉnh bộ từ vựng Premium cho kiệt tác" },
  { main: "Tối ưu hóa chuyển đổi...", sub: "Đang lập trình các điểm nhấn thu hút khách hàng" },
  { main: "Đang đóng gói kiệt tác...", sub: "Chuẩn bị ra mắt nội dung triệu view" }
];

const TECHNICAL_LOGS = [
  "Kết nối thần kinh... [OK]",
  "Quét đặc điểm hình ảnh... [XONG]",
  "Khớp xu hướng thị trường... [100%]",
  "Điều chỉnh tông giọng: Cao cấp... [KÍCH HOẠT]",
  "Loại bỏ văn bản rác... [THÀNH CÔNG]"
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [loadingText, setLoadingText] = useState({ main: "", sub: "" });
  const [currentLogs, setCurrentLogs] = useState<string[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('ltd_theme') as 'dark' | 'light') || 'dark');
  
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>(WRITING_STYLES[1].name);

  const [bannerImage, setBannerImage] = useState<string>(() => localStorage.getItem('ltd_banner') || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop");
  const [bannerHeight, setBannerHeight] = useState<number>(() => parseInt(localStorage.getItem('ltd_banner_height') || '256'));
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('long_thanh_dao_info');
    return saved ? JSON.parse(saved) : { 
      name: 'Long Thanh Đào', 
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
    document.body.className = theme;
  }, [companyInfo, bannerImage, bannerHeight, logoImage, theme, logoOpacity]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!productImage && !userPrompt) return alert("Bác chưa cung cấp thông tin sản phẩm!");
    
    setIsGenerating(true);
    setProgress(0);
    setCurrentLogs([]);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 6;
        const stepIndex = Math.floor((next / 100) * LOADING_STEPS.length);
        setLoadingText(LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)]);
        
        if (Math.random() > 0.7 && next < 95) {
          const log = TECHNICAL_LOGS[Math.floor(Math.random() * TECHNICAL_LOGS.length)];
          setCurrentLogs(prevLogs => [log, ...prevLogs.slice(0, 3)]);
        }

        if (next >= 98) return 98;
        return next;
      });
    }, 350);

    try {
      let finalImage = productImage;
      if (!productImage && userPrompt) {
        finalImage = await generateAIImage(userPrompt);
        setProductImage(finalImage);
      }

      const content = await generateAdContent(finalImage!, companyInfo, selectedStyle, userPrompt);
      await new Promise(r => setTimeout(r, 1200));
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
      alert("AI đang bận dát vàng kiệt tác khác. Thử lại sau 1 lát nhé!");
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setIsGenerating(false), 800);
    }
  };

  const LuxuryLogoIcon = () => (
    <div className="relative w-16 h-16 flex items-center justify-center scale-90 md:scale-100">
      <div className="absolute inset-0 bg-yellow-600 rounded-full blur-xl opacity-20"></div>
      <svg className="absolute w-full h-full animate-spin-slow opacity-60" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="#EAB308" strokeWidth="0.5" strokeDasharray="4 2" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#EAB308" strokeWidth="1" strokeDasharray="1 3" />
      </svg>
      <div className="relative w-12 h-12 bg-gradient-to-br from-[#111] via-[#000] to-[#222] rounded-full flex items-center justify-center border-2 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)] overflow-hidden">
        <div className="flex items-baseline z-10 font-black italic">
          <span className="text-xl bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-md">T</span>
          <span className="text-[10px] bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-md -ml-0.5">L</span>
        </div>
      </div>
    </div>
  );

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-700 flex flex-col lg:flex-row overflow-hidden font-['Plus_Jakarta_Sans'] ${isDark ? 'bg-[#050505] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Nền xám trang trí */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] opacity-10 filter blur-[80px]">
          <div className="w-full h-full bg-yellow-500/20 rounded-full"></div>
        </div>
        <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] opacity-[0.05]">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {[...Array(15)].map((_, i) => (
              <circle key={i} cx="100" cy="100" r={20 + i * 10} fill="none" stroke={isDark ? "#fff" : "#000"} strokeWidth="0.2" />
            ))}
          </svg>
        </div>
      </div>

      {/* MÀN HÌNH CHỜ LUXURY */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 backdrop-blur-3xl animate-fadeIn p-8">
          <div className="w-full max-w-lg text-center space-y-12">
            <div className="relative w-48 h-48 mx-auto">
              <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                <circle cx="96" cy="96" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="transparent" />
                <circle cx="96" cy="96" r="80" stroke="#EAB308" strokeWidth="6" fill="transparent" 
                  className="transition-all duration-500 ease-out"
                  strokeDasharray={502}
                  strokeDashoffset={502 - (502 * progress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white italic tracking-tighter">{Math.round(progress)}%</span>
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-2">Dát vàng</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic bg-gradient-to-r from-yellow-200 via-white to-yellow-600 bg-clip-text text-transparent">
                {loadingText.main || "Đang khởi tạo..."}
              </h2>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.3em] h-4">
                {loadingText.sub}
              </p>
              
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-6">
                <div 
                  className="h-full metallic-gold-btn shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all duration-700" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 text-left font-mono luxury-shadow max-w-xs mx-auto">
              <div className="flex gap-1.5 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/30"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/30"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/30"></div>
              </div>
              <div className="space-y-1">
                {currentLogs.map((log, idx) => (
                  <div key={idx} className={`text-[9px] ${idx === 0 ? 'text-yellow-500' : 'text-slate-600'}`}>
                    <span className="opacity-30 mr-2">NHẬT KÝ:</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thanh bên (Desktop) */}
      <aside className={`hidden lg:flex w-72 border-r flex-col p-8 space-y-10 z-50 glass-luxury`}>
        <div className="flex items-center gap-4">
          <LuxuryLogoIcon />
          <div className="pr-4">
            <h1 className="text-base font-black tracking-tight uppercase leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{APP_NAME}</h1>
            <p className="text-[9px] text-yellow-600 font-black uppercase tracking-widest mt-0.5">Phiên bản {VERSION}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'home' ? 'metallic-gold-btn text-black' : 'text-slate-500 hover:text-white'}`}>TRANG CHỦ</button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'history' ? 'metallic-gold-btn text-black' : 'text-slate-500 hover:text-white'}`}>LỊCH SỬ</button>
          <div className="pt-6 border-t border-white/5"></div>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>{isDark ? 'PHONG CÁCH SÁNG' : 'PHONG CÁCH TỐI'}</span>
            <div className={`w-8 h-4 rounded-full relative ${isDark ? 'bg-yellow-900/40' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-yellow-500 transition-all ${isDark ? 'left-4.5' : 'left-0.5'}`}></div>
            </div>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative pb-28 lg:pb-10 z-10 custom-scrollbar">
        {/* Banner với slogan tia sáng */}
        <div className="relative w-full overflow-hidden luxury-shadow border-b border-white/5" style={{ height: `${bannerHeight}px` }}>
          <img src={bannerImage} className="w-full h-full object-cover brightness-[0.25]" alt="Banner" />
          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#050505]' : 'from-slate-50'} via-transparent to-transparent`}></div>
          <div className="absolute bottom-10 left-8 md:left-16 pr-4">
            <h2 className="text-4xl md:text-7xl font-black tracking-tight text-white italic">
              <span className="bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent pr-2">{APP_NAME}</span>
            </h2>
            <p className="slogan-glow uppercase mt-3">
              {APP_SLOGAN}
            </p>
          </div>
          <button onClick={() => bannerInputRef.current?.click()} className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-xl rounded-full border border-white/10 text-yellow-500 hover:scale-110 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
        </div>

        <div className="px-6 md:px-12 py-10 grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-5 space-y-8">
            {/* Thẻ nhập liệu */}
            <div className="glass-luxury p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
                <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span> THÔNG TIN CỬA HÀNG
              </h3>
              <div className="space-y-4">
                {[
                  { label: "TÊN THƯƠNG HIỆU", key: "name" },
                  { label: "SỐ ĐIỆN THOẠI (HOTLINE)", key: "hotline" },
                  { label: "ĐỊA CHỈ TRỤ SỞ", key: "address" }
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-[9px] font-black text-slate-500 mb-1.5 block ml-1">{field.label}</label>
                    <input
                      type="text"
                      value={(companyInfo as any)[field.key]}
                      onChange={(e) => setCompanyInfo(p => ({...p, [field.key]: e.target.value}))}
                      className={`w-full px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold border ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-yellow-500/50' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-yellow-500/50'}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-luxury p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span> Ý TƯỞNG QUẢNG CÁO
              </h3>
              <textarea 
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Mô tả sản phẩm của bác tại đây (Ví dụ: Giày da nam cao cấp, sale 30%)..."
                className={`w-full h-32 px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold resize-none border ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-yellow-500/50' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-yellow-500/50'}`}
              />
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 mb-1.5 block ml-1 uppercase">CHỌN PHONG CÁCH VIẾT</label>
                {WRITING_STYLES.map((style) => (
                  <button key={style.id} onClick={() => setSelectedStyle(style.name)} className={`w-full text-left px-5 py-3 rounded-2xl border transition-all ${selectedStyle === style.name ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 text-slate-500'}`}>
                    <div className="text-[11px] font-black uppercase tracking-tight">{style.name}</div>
                    <div className="text-[9px] opacity-60">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-luxury p-8 rounded-[2.5rem] space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
                <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span> HÌNH ẢNH SẢN PHẨM
              </h3>
              <div onClick={() => fileInputRef.current?.click()} className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isDark ? 'border-white/10 bg-white/5 hover:border-yellow-500' : 'border-slate-200 bg-slate-50 hover:border-yellow-500'}`}>
                {productImage ? <img src={productImage} className="w-full h-full object-cover rounded-3xl" /> : (
                  <div className="text-center opacity-30">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>
                    <p className="text-[10px] font-black uppercase tracking-widest">Bấm để tải ảnh lên</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-6 rounded-[2rem] metallic-gold-btn text-black font-black text-xs tracking-[0.5em] shadow-2xl uppercase">
              {isGenerating ? "ĐANG CHẾ TÁC..." : "BẮT ĐẦU SÁNG TẠO TRIỆU VIEW"}
            </button>
          </div>

          <div id="results-section" className="xl:col-span-7 space-y-10">
             {/* Xem trước hình ảnh */}
             <div className="glass-luxury p-5 md:p-8 rounded-[3rem] relative">
              <div className="absolute top-10 left-10 z-20 bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-yellow-500/30 text-[9px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span> BẢN XEM TRƯỚC
              </div>
              
              <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-black ring-1 ring-white/10">
                {productImage ? (
                  <>
                    <img src={productImage} className="w-full h-full object-cover" alt="Preview" />
                    {logoImage && (
                      <div className="absolute top-6 right-6 w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl" 
                        style={{ opacity: logoOpacity, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={logoImage} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="absolute bottom-6 left-6 right-6 p-6 rounded-[2rem] glass-luxury border border-yellow-500/20">
                      <div className="flex flex-col items-start pr-2">
                        <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-1">{companyInfo.name}</span>
                        <h4 className="text-white text-3xl md:text-5xl font-black tracking-tight italic leading-none">{companyInfo.hotline}</h4>
                        <p className="text-white/50 text-[9px] uppercase font-bold tracking-widest mt-2 line-clamp-1">{companyInfo.address}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                     <LuxuryLogoIcon />
                     <p className="font-black text-[10px] uppercase tracking-[0.5em] mt-6">Đang đợi kiệt tác của bác...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Kết quả nội dung */}
            <div className="relative p-[1px] rounded-[3rem] overflow-hidden group">
              <div className="absolute inset-0 gold-shimmer-border opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative glass-luxury p-10 rounded-[3rem] min-h-[400px]">
                <h3 className="text-[10px] font-black mb-8 uppercase tracking-[0.4em] flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span> NỘI DUNG QUẢNG CÁO AI
                </h3>
                {generatedContent ? (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                      <p className="font-black text-2xl md:text-4xl italic tracking-tight leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent pr-2">{generatedContent.headline}</p>
                    </div>
                    <p className="leading-relaxed font-medium text-lg whitespace-pre-line text-slate-300">{generatedContent.body}</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.map(tag => (
                        <span key={tag} className="text-[10px] font-black px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-yellow-500">#{tag}</span>
                      ))}
                    </div>
                    <button onClick={() => {
                        const text = `${generatedContent.headline}\n\n${generatedContent.body}\n\n${generatedContent.hashtags.map(t => `#${t}`).join(' ')}`;
                        navigator.clipboard.writeText(text);
                        alert("Đã sao chép Content!");
                      }} className="w-full py-5 metallic-gold-btn text-black rounded-[2rem] text-[10px] font-black tracking-widest uppercase">
                      SAO CHÉP TOÀN BỘ NỘI DUNG
                    </button>
                  </div>
                ) : (
                   <div className="h-64 flex items-center justify-center opacity-10 uppercase text-[10px] font-black tracking-[0.5em]">Chưa có dữ liệu</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Điều hướng Mobile */}
      <nav className={`fixed bottom-0 w-full h-20 glass-luxury border-t flex lg:hidden justify-around items-center z-50`}>
        <button onClick={() => setActiveTab('home')} className={`text-[10px] font-black tracking-widest transition-colors ${activeTab === 'home' ? 'text-yellow-500' : 'text-slate-500'}`}>TRANG CHỦ</button>
        <button onClick={handleGenerate} className="w-16 h-16 metallic-gold-btn rounded-2xl flex items-center justify-center text-black -translate-y-8 shadow-2xl border-4 border-[#050505]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
        </button>
        <button onClick={() => setActiveTab('history')} className={`text-[10px] font-black tracking-widest transition-colors ${activeTab === 'history' ? 'text-yellow-500' : 'text-slate-500'}`}>LỊCH SỬ</button>
      </nav>

      <input type="file" hidden ref={logoInputRef} onChange={e => handleFileChange(e, setLogoImage)} />
      <input type="file" hidden ref={fileInputRef} onChange={e => handleFileChange(e, setProductImage)} />
      <input type="file" hidden ref={bannerInputRef} onChange={(e) => handleFileChange(e, setBannerImage)} />
    </div>
  );
};

export default App;
