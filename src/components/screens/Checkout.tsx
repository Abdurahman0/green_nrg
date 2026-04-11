import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '@/lib/i18n';

interface CheckoutProps {
  onBack: () => void;
  onSuccess: (orderRef: string) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onBack, onSuccess }) => {
  const { t } = useI18n();
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'cart' | 'success'>('cart');
  const [orderRef, setOrderRef] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'delivery' | 'pickup'>('delivery');

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await api.checkout({
        full_name: fullName || undefined,
        phone: phone || undefined,
        address: fulfillmentMethod === 'delivery' ? address || undefined : undefined,
        fulfillment_method: fulfillmentMethod,
        payment_method: 'telegram',
        items,
      });
      setOrderRef(response.contract_id || response.message);
      setStep('success');
      clearCart();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[110] bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="w-32 h-32 bg-primary/10 rounded-[3rem] flex items-center justify-center text-primary mb-8"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">{t('checkout.placed')}</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {t('checkout.thanks')} <span className="font-bold text-gray-900">{orderRef}</span>
        </p>
        <div className="w-full space-y-3">
          <Button 
            className="w-full h-14 rounded-2xl font-bold text-lg"
            onClick={() => onSuccess(orderRef)}
          >
            {t('checkout.track')}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full h-14 rounded-2xl font-bold text-gray-500"
            onClick={onBack}
          >
            {t('checkout.backHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-white border-b border-gray-50">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('checkout.title')}</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Cart Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('checkout.yourItems')}</h2>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{items.length} {t('checkout.items')}</span>
            </div>
            
            {items.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-white overflow-hidden flex-shrink-0 shadow-sm">
                      <img 
                        src={`https://picsum.photos/seed/${item.id}/200/200`} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-primary">${item.price.toLocaleString()}</span>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-gray-400 hover:text-primary"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold min-w-[1rem] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-gray-400 hover:text-primary"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                  <ShoppingBag size={32} />
                </div>
                <p className="text-gray-500 font-medium">{t('checkout.empty')}</p>
                <Button variant="link" className="text-primary mt-2" onClick={onBack}>{t('checkout.startShopping')}</Button>
              </div>
            )}
          </div>

          {/* Payment Method Placeholder */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Contact Details</h2>
            <div className="p-4 bg-white rounded-3xl border border-gray-100 space-y-3">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFulfillmentMethod('delivery')}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    fulfillmentMethod === 'delivery'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setFulfillmentMethod('pickup')}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    fulfillmentMethod === 'pickup'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  Pickup
                </button>
              </div>
              {fulfillmentMethod === 'delivery' && (
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Delivery address"
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('checkout.paymentMethod')}</h2>
            <div className="p-5 bg-white rounded-3xl border-2 border-primary flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Telegram Pay</h3>
                  <p className="text-[10px] font-medium text-gray-400">{t('checkout.secureVia')}</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-4 border-primary bg-white" />
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <ShieldCheck size={16} className="text-primary" />
              {t('checkout.secure')}
            </div>
            <div className="w-1 h-1 bg-gray-200 rounded-full" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <CheckCircle2 size={16} className="text-primary" />
              {t('checkout.official')}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Summary & Action */}
      <div className="p-8 bg-white border-t border-gray-100 space-y-6 pb-safe-area-bottom">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{t('checkout.subtotal')}</span>
            <span className="text-gray-900 font-bold">${totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{t('checkout.delivery')}</span>
            <span className="text-primary font-bold">{t('checkout.free')}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-50">
            <span className="text-lg font-bold text-gray-900">{t('checkout.total')}</span>
            <span className="text-2xl font-black text-primary">${totalPrice.toLocaleString()}</span>
          </div>
        </div>
        
        <Button 
          className="w-full h-16 rounded-[2rem] text-lg font-bold shadow-2xl shadow-primary/30 relative overflow-hidden group"
          disabled={items.length === 0 || isProcessing}
          onClick={handleCheckout}
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('checkout.processing')}
            </div>
          ) : (
            <>
              {t('checkout.confirm')}
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
