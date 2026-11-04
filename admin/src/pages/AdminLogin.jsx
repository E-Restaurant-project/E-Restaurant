import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/common/Button';

export const AdminLogin = () => {
  const { login, verify2FA, resend2FA, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Step state: 'credentials' | '2fa'
  const [step, setStep] = useState('credentials');

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when transitioning to 2FA
  useEffect(() => {
    if (step === '2fa') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Step 1: Submit Credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.requires2FA) {
      setStep('2fa');
      setSuccessMsg(res.message || 'សូមបញ្ចូលកូដ ៦ ខ្ទង់ពី Google Authenticator ឬពីអ៊ីមែលរបស់អ្នក');
      setResendCooldown(60);
    } else if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Invalid administrator email or password');
    }
  };

  // Handle Step 2: Submit 2FA Code
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your security code.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await verify2FA(email, code);
    setLoading(false);

    if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Invalid or expired 2FA code.');
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const digits = pasted.split('');
    const newOtp = [...otp];
    digits.forEach((d, i) => {
      if (i < 6) newOtp[i] = d;
    });
    setOtp(newOtp);
    otpInputsRef.current[Math.min(digits.length, 5)]?.focus();
  };

  // Resend 2FA Email Code
  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    setError('');
    const res = await resend2FA(email);
    setResending(false);

    if (res.success) {
      setSuccessMsg('កូដសុវត្ថិភាព 2FA ថ្មីត្រូវបានផ្ញើទៅកាន់អ៊ីមែលរបស់អ្នករួចរាល់ហើយ។');
      setResendCooldown(60);
    } else {
      setError(res.error || 'Failed to resend 2FA code.');
    }
  };

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 'var(--space-md)' }}>
          <a
            href="http://localhost:3000"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft size={16} />
            <span>{t('common.back_home')}</span>
          </a>
        </div>

        <img
          src="/phum_yeung_logo.jpg"
          alt="Phum Yeung Restaurant"
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            objectFit: 'cover',
            margin: '0 auto var(--space-xs)',
            boxShadow: '0 6px 18px rgba(128, 0, 32, 0.25)',
            border: '2.5px solid var(--color-primary)',
            display: 'block'
          }}
        />

        <div className="admin-2fa-badge">
          <ShieldCheck size={14} />
          <span>Security 2FA Protected (TOTP / Authenticator)</span>
        </div>

        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '2px', fontSize: '1.4rem', fontWeight: 800 }}>
          ភោជនីយដ្ឋាន ភូមិយើង
        </h2>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '1.2px',
          color: 'var(--color-secondary-dark)',
          textTransform: 'uppercase',
          marginBottom: '4px'
        }}>
          PHUM YEUNG RESTAURANT
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          {step === 'credentials' ? t('admin.login_title') : 'ផ្ទៀងផ្ទាត់កូដសុវត្ថិភាព ២ ជាន់ (2FA Verification)'}
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} style={{ textAlign: 'left' }}>
            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} />
                <span>{t('admin.email')}</span>
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={15} />
                <span>{t('admin.password')}</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '44px', width: '100%' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '6px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={loading}
              icon={<ShieldCheck size={18} />}
            >
              {loading ? t('common.loading') : t('admin.login_btn')}
            </Button>
          </form>
        )}

        {/* STEP 2: 2FA VERIFICATION CODE */}
        {step === '2fa' && (
          <form onSubmit={handle2FASubmit}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-xs)' }}>
              សូមបញ្ចូលកូដសម្ងាត់ ៦ ខ្ទង់ពី Google Authenticator ឬពីអ៊ីមែលរបស់អ្នក
            </p>

            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
              {email}
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: 'var(--space-md)',
              fontSize: '0.82rem',
              color: '#475569',
              lineHeight: 1.5,
              textAlign: 'left'
            }}>
              <div>📱 <strong>Google Authenticator:</strong> បញ្ចូលកូដ ៦ ខ្ទង់ពីកម្មវិធី Authenticator របស់អ្នក។</div>
            </div>

            <div className="admin-otp-box" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="admin-otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  required
                />
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              icon={<KeyRound size={18} />}
            >
              {loading ? t('common.loading') : t('admin.verify_btn')}
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-lg)' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
                onClick={() => { setStep('credentials'); setError(''); setSuccessMsg(''); }}
              >
                ← {t('admin.back_to_login')}
              </button>

              <button
                type="button"
                disabled={resending || resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--color-text-muted)' : 'var(--color-primary)',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={handleResend}
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                <span>
                  {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Email Code'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
