import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Leaf, ShoppingBag, Shield } from 'lucide-react';

const slides = [
  {
    emoji: '💳',
    icon: Leaf,
    title: 'Thanh toán → Tích GCS',
    desc: 'Mỗi giao dịch số đều tạo ra Điểm Tín Dụng Xanh (GCS). Thanh toán hóa đơn điện 500K lúc 18h → nhận ngay 90 GCS.',
    example: {
      label: 'Ví dụ tính điểm:',
      calc: '500.000 VND ÷ 10.000 × 1.2 × 1.5 = 90 GCS',
      note: '× 1.2 loại dịch vụ công · × 1.5 giờ cao điểm',
    },
    color: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    emoji: '🏆',
    icon: ShoppingBag,
    title: 'Lên bậc → Mở quyền lợi',
    desc: '5 bậc hạng: 🌱 Mầm → 🌿 Chồi → 🌳 Cây → 🌲 Rừng → 🏆 Di sản. Mỗi bậc mở thêm đặc quyền tài chính độc quyền.',
    tiers: [
      { e: '🌱', l: 'Mầm', pts: '0–999 GCS' },
      { e: '🌿', l: 'Chồi', pts: '1K–5K GCS' },
      { e: '🌳', l: 'Cây', pts: '5K–15K GCS' },
      { e: '🌲', l: 'Rừng', pts: '15K–50K GCS' },
      { e: '🏆', l: 'Di sản', pts: '50K+ GCS' },
    ],
    color: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-500',
  },
  {
    emoji: '🎁',
    icon: Shield,
    title: 'Đổi GCS → Nhận quà thật',
    desc: '1 GCS = 100 VND. Đổi voucher Shopee, vé máy bay, nạp điện thoại, trồng cây thật ở Việt Nam và hơn thế nữa.',
    partners: ['📱 Viễn thông', '🛒 Mua sắm', '🍜 F&B', '✈️ Vận tải', '🎬 Giải trí', '🌿 Quà xanh'],
    blockchain: true,
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-500',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const slide = slides[step];

  const handleNext = () => {
    if (step < slides.length - 1) setStep(s => s + 1);
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-6 py-12">
      {/* Skip */}
      <div className="w-full flex justify-end">
        <button onClick={() => navigate('/')} className="text-xs text-muted-foreground hover:text-foreground">
          Bỏ qua
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm space-y-6 text-center"
        >
          {/* Hero Emoji */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center text-6xl`}
          >
            {slide.emoji}
          </motion.div>

          <div>
            <h2 className="font-heading font-bold text-2xl mb-2">{slide.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{slide.desc}</p>
          </div>

          {/* Slide-specific content */}
          {slide.example && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left">
              <p className="text-[10px] text-muted-foreground mb-1">{slide.example.label}</p>
              <p className="font-heading font-bold text-primary text-sm">{slide.example.calc}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{slide.example.note}</p>
            </div>
          )}

          {slide.tiers && (
            <div className="flex justify-center gap-2 flex-wrap">
              {slide.tiers.map(t => (
                <div key={t.l} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-card border border-border/60 min-w-[52px]">
                  <span className="text-xl">{t.e}</span>
                  <span className="text-[9px] font-semibold">{t.l}</span>
                  <span className="text-[8px] text-muted-foreground">{t.pts}</span>
                </div>
              ))}
            </div>
          )}

          {slide.partners && (
            <div className="grid grid-cols-3 gap-2">
              {slide.partners.map(p => (
                <div key={p} className="bg-card border border-border/60 rounded-xl p-2.5 text-center">
                  <p className="text-xs font-medium">{p}</p>
                </div>
              ))}
            </div>
          )}

          {slide.blockchain && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <p className="text-[10px] text-muted-foreground text-left">
                Mọi giao dịch GCS được ghi bất biến trên Hyperledger Fabric blockchain với mã hóa SHA3-256.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${i === step ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted'}`}
            />
          ))}
        </div>

        <Button onClick={handleNext} className="w-full h-12 rounded-xl font-semibold text-base gap-2">
          {step < slides.length - 1 ? (
            <><span>Tiếp theo</span><ChevronRight className="w-4 h-4" /></>
          ) : (
            <><Leaf className="w-4 h-4" /><span>Bắt đầu tích GCS!</span></>
          )}
        </Button>
      </div>
    </div>
  );
}