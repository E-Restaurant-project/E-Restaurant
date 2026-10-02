import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, ArrowLeft, KeyRound, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/common/Button';

export const Auth = () => {
  const { t } = useLanguage();
  const {
    isCustomerLoggedIn,
    customerLogin,
    customerRegister,
    customerVerify,
    customerResend,
    loading
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/account';

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [slideDirection, setSlideDirection] = useState('forward'); // 'forward' | 'backward'
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    if (newMode === 'register') {
      setSlideDirection('forward');
    } else if (newMode === 'login') {
      setSlideDirection('backward');
    }
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  const [verifyEmail, setVerifyEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devCode, setDevCode] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resending, setResending] = useState(false);

  const otpInputsRef = useRef([]);

  // If already logged in, redirect
  if (isCustomerLoggedIn) {
    navigate(from, { replace: true });
    return null;
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginData.email || !loginData.password) {
      setError(t('common.error'));
      return;
    }

    const res = await customerLogin(loginData.email, loginData.password);
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      // If unverified, guide to verification mode
      if (res.error && res.error.toLowerCase().includes('not verified')) {
        setVerifyEmail(loginData.email);
        setDevCode(res.devCode || null);
        setMode('verify');
        setError(res.error);
      } else {
        setError(res.error || 'Invalid email or password');
      }
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!registerData.name || !registerData.email || !registerData.password) {
      setError(t('common.error'));
      return;
    }

    const res = await customerRegister(registerData);
    if (res.success) {
      setVerifyEmail(registerData.email);
      setDevCode(res.devCode || null);
      setSuccessMsg(t('auth.code_sent'));
      setMode('verify');
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  // Handle OTP digit change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto advance
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
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Handle OTP Verification Submit
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter complete 6-digit code');
      return;
    }

    const res = await customerVerify(verifyEmail, fullCode);
    if (res.success) {
      setSuccessMsg(t('auth.verified_success'));
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } else {
      setError(res.error || 'Verification code is invalid or has expired');
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    setError('');
    setResending(true);
    const res = await customerResend(verifyEmail);
    setResending(false);

    if (res.success) {
      setDevCode(res.devCode || null);
      setSuccessMsg(t('auth.code_sent'));
    } else {
      setError(res.error || 'Failed to resend code');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <ArrowLeft size={16} />
              <span>{t('common.back_home')}</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src="/phum_yeung_logo.jpg"
                alt="Phum Yeung"
                style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                ភោជនីយដ្ឋាន ភូមិយើង
              </span>
            </div>
          </div>

          <h2>
            {mode === 'login' && t('auth.login_title')}
            {mode === 'register' && t('auth.register_title')}
            {mode === 'verify' && t('auth.verify_title')}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {mode === 'login' && t('auth.login_subtitle')}
            {mode === 'register' && t('auth.register_subtitle')}
            {mode === 'verify' && `${t('auth.verify_subtitle')} (${verifyEmail})`}
          </p>

          {mode !== 'verify' && (
            <div className="auth-pill-nav">
              <div className={`auth-pill-slider ${mode === 'register' ? 'auth-pill-slider--register' : ''}`} />
              <button
                type="button"
                className={`auth-pill-btn ${mode === 'login' ? 'auth-pill-btn--active' : ''}`}
                onClick={() => switchMode('login')}
              >
                <KeyRound size={16} />
                <span>{t('auth.login_title')}</span>
              </button>
              <button
                type="button"
                className={`auth-pill-btn ${mode === 'register' ? 'auth-pill-btn--active' : ''}`}
                onClick={() => switchMode('register')}
              >
                <User size={16} />
                <span>{t('auth.register_title')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="auth-card__body">
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-md)',
              fontSize: '0.88rem'
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
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-md)',
              fontSize: '0.88rem'
            }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dev Mode Simulation Hint */}
          {devCode && mode === 'verify' && (
            <div style={{
              backgroundColor: 'var(--color-secondary-subtle)',
              border: '1px dashed var(--color-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm) var(--space-md)',
              marginBottom: 'var(--space-md)',
              fontSize: '0.88rem',
              color: 'var(--color-secondary-dark)',
              textAlign: 'center'
            }}>
              <strong>{t('auth.dev_hint')}</strong>{' '}
              <span style={{ fontSize: '1.1rem', letterSpacing: '2px', fontWeight: 800, color: 'var(--color-primary)' }}>
                {devCode}
              </span>
              <button
                type="button"
                style={{
                  display: 'block',
                  margin: '4px auto 0',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
                onClick={() => setOtp(String(devCode).split(''))}
              >
                Auto-fill Code
              </button>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div key="login" className={`auth-form-viewport ${slideDirection === 'forward' ? 'auth-slide-forward' : 'auth-slide-backward'}`}>
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={16} />
                    <span>{t('auth.email')}</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="example@gmail.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  />
                </div>

                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={16} />
                    <span>{t('auth.password')}</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="form-input"
                      required
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      style={{ paddingRight: '44px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
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
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="auth-field-stagger">
                  <Button type="submit" variant="primary" block size="lg" disabled={loading}>
                    {loading ? t('common.loading') : t('auth.btn_login')}
                  </Button>
                </div>

                <div className="auth-field-stagger" style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.88rem' }}
                    onClick={() => switchMode('register')}
                  >
                    {t('auth.no_account')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <div key="register" className={`auth-form-viewport ${slideDirection === 'forward' ? 'auth-slide-forward' : 'auth-slide-backward'}`}>
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-sm)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} />
                    <span>{t('auth.full_name')}</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="សុខ ចាន់ដារា"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  />
                </div>

                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-sm)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={16} />
                    <span>{t('auth.email')}</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="dara@gmail.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </div>

                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-sm)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={16} />
                    <span>{t('auth.password')}</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      className="form-input"
                      required
                      placeholder="•••••••• (យ៉ាងតិច ៦ តួអក្សរ)"
                      minLength={6}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      style={{ paddingRight: '44px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
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
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-sm)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={16} />
                    <span>{t('auth.phone')}</span>
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="012 345 678"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} />
                    <span>{t('auth.address')}</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ផ្ទះលេខ #12, ផ្លូវ 271, បឹងទំពុន..."
                    value={registerData.address}
                    onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                  />
                </div>

                <div className="auth-field-stagger">
                  <Button type="submit" variant="primary" block size="lg" disabled={loading}>
                    {loading ? t('common.loading') : t('auth.btn_register')}
                  </Button>
                </div>

                <div className="auth-field-stagger" style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.88rem' }}
                    onClick={() => switchMode('login')}
                  >
                    {t('auth.has_account')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE: VERIFY OTP */}
          {mode === 'verify' && (
            <div key="verify" className={`auth-form-viewport ${slideDirection === 'forward' ? 'auth-slide-forward' : 'auth-slide-backward'}`}>
              <form onSubmit={handleVerifySubmit}>
                <div style={{ textAlign: 'center', margin: 'var(--space-sm) 0 var(--space-md)' }}>
                  <KeyRound size={40} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-xs)' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('auth.enter_otp')}</p>
                </div>

                <div className="auth-otp-box" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="auth-otp-input"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>

                <Button type="submit" variant="primary" block size="lg" disabled={loading || otp.join('').length !== 6}>
                  {loading ? t('common.loading') : t('auth.verify_btn')}
                </Button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-lg)' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => switchMode('login')}
                  >
                    ← {t('auth.btn_login')}
                  </button>

                  <button
                    type="button"
                    disabled={resending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={handleResend}
                  >
                    <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                    <span>{t('auth.resend_btn')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
