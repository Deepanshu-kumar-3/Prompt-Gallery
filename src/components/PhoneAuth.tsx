import { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Phone, ArrowRight, Key } from 'lucide-react';
import { motion } from 'motion/react';

export function PhoneAuth({ onCancel }: { onCancel: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError('');
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      console.error(err);
    }
    setLoading(false);
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) return;
    
    setLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (err: any) {
      setError('Invalid OTP code');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col gap-4 text-left"
    >
      <div id="recaptcha-container"></div>
      
      {!confirmationResult ? (
        <form onSubmit={requestOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Phone Number (with country code)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                required
              />
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-black font-medium py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : 'Send OTP'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Verification Code</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                required
              />
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmationResult(null)}
              className="flex-1 bg-white/5 border border-white/10 text-white font-medium py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-purple text-white font-medium py-3 rounded-xl hover:bg-brand-purple/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
