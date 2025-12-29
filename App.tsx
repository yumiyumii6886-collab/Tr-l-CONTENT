
import React, { useState, useRef } from 'react';
import { CompanyInfo, AdContent } from './types';
import { generateAdContent } from './services/geminiService';

// InputGroup Component được định nghĩa trực tiếp tại đây để đảm bảo build không lỗi đường dẫn
interface InputGroupProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, placeholder }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-800"
    />
  </div>
);

const App: React.FC = () => {
  const [bannerImage, setBannerImage] = useState<string | null>("https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoOpacity, setLogoOpacity] = useState<number>(0.8);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    hotline: '',
    address: ''
  });
  const [generatedContent, setGeneratedContent] = useState<AdContent | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!productImage) {
      alert("Vui lòng tải ảnh sản phẩm lên!");
      return;
    }
    if (!companyInfo.name || !companyInfo.hotline) {
      alert("Vui lòng điền thông tin công ty!");
      return;
    }

    setIsGenerating(true);
    try {
      const content = await generateAdContent(productImage, companyInfo);
      setGeneratedContent(content);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi tạo nội dung. Vui lòng kiểm tra lại API_KEY!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-24">
      <div 
        className="relative w-full max-w-4xl h-56 sm:h-72 overflow-hidden rounded-b-[2.5rem] shadow-xl cursor-pointer group"
        onClick={() => bannerInputRef.current?.click()}
      >
        <img 
          src={bannerImage || ""} 
          alt="App Banner" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
          <div className="safe-top">
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">AdGenius Pro</h1>
            <p className="text-indigo-200 font-medium opacity-90">AI Content Marketing Assistant</p>
          </div>
        </div>
        <input type="file" hidden ref={bannerInputRef} onChange={(e) => handleFileChange(e, setBannerImage)} accept="image/*" />
      </div>

      <main className="w-full max-w-4xl px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              Thông tin thương hiệu
            </h2>

            <div className="space-y-1">
              <InputGroup 
                label="Tên Công Ty" 
                value={companyInfo.name} 
                onChange={(v) => setCompanyInfo(prev => ({...prev, name: v}))} 
                placeholder="VD: Shop Thời Trang Luxury"
              />
              <InputGroup 
                label="Hotline" 
                value={companyInfo.hotline} 
                onChange={(v) => setCompanyInfo(prev => ({...prev, hotline: v}))} 
                placeholder="VD: 0900.xxx.xxx"
              />
              <InputGroup 
                label="Địa chỉ" 
                value={companyInfo.address} 
                onChange={(v) => setCompanyInfo(prev => ({...prev, address: v}))} 
                placeholder="VD: Quận 1, TP. Hồ Chí Minh"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Logo thương hiệu</label>
              <div className="flex items-center gap-5">
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-200 bg-indigo-50/30 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-all shadow-inner"
                >
                  {logoImage ? (
                    <img src={logoImage} className="w-full h-full object-cover" alt="Logo" />
                  ) : (
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Độ mờ logo</span>
                    <span className="text-xs font-bold text-indigo-600">{Math.round(logoOpacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={logoOpacity} 
                    onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
              <input type="file" hidden ref={logoInputRef} onChange={(e) => handleFileChange(e, setLogoImage)} accept="image/*" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              Sản phẩm quảng cáo
            </h2>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-300 transition-all overflow-hidden group"
            >
              {productImage ? (
                <img src={productImage} className="w-full h-full object-cover" alt="Product" />
              ) : (
                <div className="text-center p-6">
                  <div className="bg-white shadow-sm w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-700">Chụp hoặc Tải ảnh</p>
                  <p className="text-xs text-slate-400 mt-1">AI sẽ tự nhận diện sản phẩm</p>
                </div>
              )}
            </div>
            <input type="file" hidden ref={fileInputRef} onChange={(e) => handleFileChange(e, setProductImage)} accept="image/*" />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 rounded-2xl font-black text-white shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 ${
              isGenerating ? 'bg-slate-400 scale-95' : 'bg-indigo-600 active:scale-95'
            }`}
          >
            {isGenerating ? (
              <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                TẠO BÀI VIẾT NGAY
              </>
            )}
          </button>
        </section>

        <section className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-2 h-6 bg-violet-600 rounded-full"></span>
              Xem trước hình ảnh
            </h2>
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group">
              {productImage ? (
                <>
                  <img src={productImage} className="w-full h-full object-cover" alt="Preview" />
                  {logoImage && (
                    <div 
                      className="absolute top-4 right-4 w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-lg pointer-events-none"
                      style={{ opacity: logoOpacity }}
                    >
                      <img src={logoImage} className="w-full h-full object-cover" alt="Overlay" />
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{companyInfo.name || "Brand Name"}</p>
                    <p className="text-white text-xs font-medium">{companyInfo.hotline || "Hotline"}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300 text-sm italic">
                  Chưa có ảnh xem trước
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-h-[300px]">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Nội dung đề xuất
            </h2>
            {generatedContent ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-indigo-900 font-black text-lg leading-tight">{generatedContent.headline}</p>
                </div>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line px-1">
                  {generatedContent.body}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                  {generatedContent.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs font-bold text-indigo-600">#{tag}</span>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    const text = `${generatedContent.headline}\n\n${generatedContent.body}\n\n${generatedContent.hashtags.map(t => `#${t}`).join(' ')}`;
                    navigator.clipboard.writeText(text);
                    alert("Đã sao chép vào bộ nhớ tạm!");
                  }}
                  className="w-full py-3 mt-4 border-2 border-slate-100 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  SAO CHÉP BÀI VIẾT
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <svg className="w-16 h-16 mb-4 opacity-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg>
                <p className="text-xs font-medium uppercase tracking-widest">Đang chờ dữ liệu...</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center md:hidden z-50 safe-bottom h-20">
        <button className="p-3 text-indigo-600 flex flex-col items-center gap-1">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg>
          <span className="text-[10px] font-black uppercase">Home</span>
        </button>
        <button 
          onClick={handleGenerate}
          className="bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 -translate-y-6 border-4 border-slate-50 active:scale-90 transition-all"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
        <button className="p-3 text-slate-400 flex flex-col items-center gap-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] font-black uppercase">Profile</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
