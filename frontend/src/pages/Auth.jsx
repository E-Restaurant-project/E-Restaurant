import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  ArrowLeft,
  KeyRound,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Key,
  Check,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/common/Button';

export const Auth = () => {
  const { t, language } = useLanguage();
  const isKm = language === 'km';
  const {
    isCustomerLoggedIn,
    customerLogin,
    customerRegister,
    customerVerify,
    customerResend,
    customerForgotPassword,
    customerResetPassword,
    customerGoogleLogin,
    loading
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/account';

  // Detect In-App Browsers (Telegram, Facebook, Instagram) where Google blocks OAuth
  const isInAppBrowser = typeof navigator !== 'undefined' &&
    /Telegram|FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger/i.test(navigator.userAgent || navigator.vendor || '');

  const [mode, setMode] = useState(() => {
    try {
      const params = new URLSearchParams(window?.location?.search || '');
      if (params.get('mode') === 'register') return 'register';
    } catch (_) {}
    return 'login';
  });

  const [slideDirection, setSlideDirection] = useState('forward'); // 'forward' | 'backward'

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const m = params.get('mode');
      if (m === 'register' || m === 'login' || m === 'verify') {
        setMode(m);
      }
    } catch (_) {}
  }, [location.search]);

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  // registerStep: 'google' (step 1: connect with Google first) | 'details' (step 2: fill name, phone, address)
  const [registerStep, setRegisterStep] = useState('google');
  const [googleProfile, setGoogleProfile] = useState(null);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setSlideDirection(newMode === 'register' ? 'forward' : 'backward');
    setMode(newMode);
    setRegisterStep('google');
    setError('');
    setSuccessMsg('');
  };

  // Google OAuth Custom Button Integration
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '648412527061-tt1sg220n40ca48c86i19j79mi0eu34t.apps.googleusercontent.com';
  const [googleLoading, setGoogleLoading] = useState(false);
  const tokenClientRef = useRef(null);

  useEffect(() => {
    const setupTokenClient = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse?.error) {
                setGoogleLoading(false);
                setError(tokenResponse.error_description || 'Google sign-in was canceled');
                return;
              }
              if (tokenResponse?.access_token) {
                try {
                  setGoogleLoading(true);
                  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const profile = await userInfoRes.json();
                  const captured = {
                    access_token: tokenResponse.access_token,
                    email: profile.email,
                    name: profile.name || profile.given_name || profile.email.split('@')[0],
                    picture: profile.picture || '',
                    sub: profile.sub || ''
                  };
                  setGoogleProfile(captured);
                  setGoogleLoading(false);

                  // If in Register mode: Advance to Step 2 to fill name, phone, address!
                  if (mode === 'register') {
                    setRegisterData((prev) => ({
                      ...prev,
                      name: captured.name || prev.name,
                      email: captured.email || prev.email
                    }));
                    setRegisterStep('details');
                    setSuccessMsg(
                      isKm
                        ? 'គណនី Google ត្រូវបានភ្ជាប់! សូមបំពេញលេខទូរស័ព្ទ និងអាសយដ្ឋាន'
                        : 'Google account connected! Please enter your phone & address'
                    );
                  } else {
                    // In Login mode: Log in immediately with Google
                    const res = await customerGoogleLogin(captured);
                    if (res.success) {
                      navigate(from, { replace: true });
                    } else {
                      setError(res.error || 'Google login failed');
                    }
                  }
                } catch (err) {
                  setGoogleLoading(false);
                  setError(err.message || 'Error processing Google profile');
                }
              }
            }
          });
        } catch (_) {}
      }
    };

    if (window.google?.accounts?.oauth2) {
      setupTokenClient();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          setupTokenClient();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [googleClientId, customerGoogleLogin, mode, from, navigate, isKm]);

  const handleGoogleSignIn = () => {
    setError('');
    setSuccessMsg('');

    if (isInAppBrowser) {
      setError(
        isKm
          ? 'Google មិនអនុញ្ញាតឱ្យ Login ក្នុង Telegram ទេ។ សូមចុចសញ្ញា (...) នៅជ្រុងខាងលើស្តាំ ហើយជ្រើសរើស "Open in Chrome" ឬ "Open in Safari"។'
          : 'Google blocks sign-in inside Telegram WebView. Please tap (...) in top right and choose "Open in Chrome" or "Open in Safari".'
      );
      return;
    }

    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else {
      setError('Google Sign-In is initializing. Please try again in a few seconds.');
    }
  };

  // OTP Verification state
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const otpInputsRef = useRef([]);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resetOtpInputsRef = useRef([]);

  // Feedback states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto redirect if already logged in
  useEffect(() => {
    if (isCustomerLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [isCustomerLoggedIn, from, navigate]);

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginData.email || !loginData.password) {
      setError(isKm ? 'សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់' : 'Please enter email and password');
      return;
    }

    const res = await customerLogin(loginData.email, loginData.password);
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      if (res.error && res.error.toLowerCase().includes('not verified')) {
        setVerifyEmail(loginData.email);
        setMode('verify');
        setError(res.error);
      } else {
        setError(res.error || (isKm ? 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ' : 'Invalid email or password'));
      }
    }
  };

  // Handle Google Step 2 Completion Submit (Name, Phone, Address)
  const handleGoogleRegisterComplete = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!registerData.name.trim()) {
      setError(isKm ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Please enter your full name');
      return;
    }
    if (!registerData.phone.trim()) {
      setError(isKm ? 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក' : 'Please enter your phone number');
      return;
    }
    if (!registerData.address.trim()) {
      setError(isKm ? 'សូមបញ្ចូលអាសយដ្ឋានដឹកជញ្ជូនរបស់អ្នក' : 'Please enter your delivery address');
      return;
    }

    setGoogleLoading(true);
    const payload = {
      ...googleProfile,
      name: registerData.name.trim(),
      phone: registerData.phone.trim(),
      address: registerData.address.trim()
    };

    const res = await customerGoogleLogin(payload);
    setGoogleLoading(false);

    if (res.success) {
      showToastMessage(isKm ? 'ចុះឈ្មោះ និងចូលគណនីជោគជ័យ!' : 'Account created & signed in successfully!');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } else {
      setError(res.error || (isKm ? 'មិនអាចចុះឈ្មោះបានទេ' : 'Failed to complete registration'));
    }
  };



  const showToastMessage = (msg) => {
    setSuccessMsg(msg);
  };

  // Handle OTP digit change
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
      setError(isKm ? 'សូមបញ្ចូលកូដសម្ងាត់ ៦ ខ្ទង់ឱ្យបានពេញលេញ' : 'Please enter complete 6-digit code');
      return;
    }

    const res = await customerVerify(verifyEmail, fullCode);
    if (res.success) {
      setSuccessMsg(isKm ? 'គណនីត្រូវបានផ្ទៀងផ្ទាត់ដោយជោគជ័យ!' : 'Account verified successfully!');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } else {
      setError(res.error || (isKm ? 'លេខកូដមិនត្រឹមត្រូវ ឬផុតកំណត់' : 'Invalid or expired verification code'));
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError('');
    const res = await customerResend(verifyEmail);
    setResending(false);
    if (res.success) {
      setSuccessMsg(isKm ? 'លេខកូដផ្ទៀងផ្ទាត់ត្រូវបានផ្ញើ!' : 'Verification code resent!');
    } else {
      setError(res.error || 'Failed to resend code');
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!forgotEmail) {
      setError(isKm ? 'សូមបញ្ចូលអ៊ីមែលរបស់អ្នក' : 'Please enter your email');
      return;
    }

    const res = await customerForgotPassword(forgotEmail);
    if (res.success) {
      setSuccessMsg(isKm ? 'លេខកូដប្តូរពាក្យសម្ងាត់ត្រូវបានផ្ញើទៅ Gmail របស់អ្នក!' : 'Reset code sent to your Gmail!');
      setMode('reset');
    } else {
      setError(res.error || (isKm ? 'មិនអាចផ្ញើលេខកូដបានទេ' : 'Failed to send reset code'));
    }
  };

  // Handle Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const fullCode = resetOtp.join('');
    if (fullCode.length !== 6) {
      setError(isKm ? 'សូមបញ្ចូលកូដសម្ងាត់ ៦ ខ្ទង់ឱ្យបានពេញលេញ' : 'Please enter complete 6-digit code');
      return;
    }

    if (newPassword.length < 6) {
      setError(isKm ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ' : 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isKm ? 'ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ' : 'Passwords do not match');
      return;
    }

    const res = await customerResetPassword(forgotEmail, fullCode, newPassword);
    if (res.success) {
      setSuccessMsg(isKm ? 'បានប្តូរពាក្យសម្ងាត់ជោគជ័យ!' : 'Password reset successful!');
      setTimeout(() => {
        setMode('login');
        setLoginData({ email: forgotEmail, password: '' });
      }, 1500);
    } else {
      setError(res.error || (isKm ? 'ការប្តូរពាក្យសម្ងាត់មិនជោគជ័យ' : 'Failed to reset password'));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          {/* Top Brand & Back Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              <ArrowLeft size={16} />
              <span>{isKm ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to Home'}</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src="/phum_yeung_logo.jpg"
                alt="Phum Yeung"
                style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {isKm ? 'ភោជនីយដ្ឋាន ភូមិយើង' : 'Phum Yeung'}
              </span>
            </div>
          </div>

          <h2>
            {mode === 'login' && (isKm ? 'ចូលគណនី' : 'Sign In')}
            {mode === 'register' && (registerStep === 'details' ? (isKm ? 'បំពេញព័ត៌មានបន្ថែម' : 'Complete Profile') : (isKm ? 'ចុះឈ្មោះគណនីថ្មី' : 'Sign Up'))}
            {mode === 'verify' && (isKm ? 'ផ្ទៀងផ្ទាត់អ៊ីមែល' : 'Verify Email')}
            {mode === 'forgot' && (isKm ? 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ' : 'Reset Password')}
            {mode === 'reset' && (isKm ? 'បង្កើតពាក្យសម្ងាត់ថ្មី' : 'New Password')}
          </h2>

          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {mode === 'login' && (isKm ? 'ចូលគណនីដើម្បីគ្រប់គ្រងការកុម្ម៉ង់ និងទទួលប្រូម៉ូសិនពិសេស' : 'Sign in to manage orders and access promotions')}
            {mode === 'register' && (registerStep === 'details' ? (isKm ? 'សូមបំពេញឈ្មោះ លេខទូរស័ព្ទ និងអាសយដ្ឋានដឹកជញ្ជូន' : 'Enter your phone & delivery address to complete your account') : (isKm ? 'បង្កើតគណនីដើម្បីកុម្ម៉ង់អាហារកាន់តែរហ័ស' : 'Create an account to order food quickly'))}
            {mode === 'verify' && `${isKm ? 'កូដ ៦ ខ្ទង់បានផ្ញើទៅកាន់' : 'Code sent to'} (${verifyEmail})`}
          </p>

          {/* Rounded Cycle Pill Slider Navigation with Spring Physics Animation */}
          {!['verify', 'forgot', 'reset'].includes(mode) && (
            <div className="auth-pill-nav">
              <div className={`auth-pill-slider ${mode === 'register' ? 'auth-pill-slider--register' : ''}`} />
              <button
                type="button"
                className={`auth-pill-btn ${mode === 'login' ? 'auth-pill-btn--active' : ''}`}
                onClick={() => switchMode('login')}
              >
                <KeyRound size={16} />
                <span>{isKm ? 'ចូលគណនី' : 'Sign In'}</span>
              </button>
              <button
                type="button"
                className={`auth-pill-btn ${mode === 'register' ? 'auth-pill-btn--active' : ''}`}
                onClick={() => switchMode('register')}
              >
                <User size={16} />
                <span>{isKm ? 'ចុះឈ្មោះ' : 'Sign Up'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="auth-card__body">
          {/* Telegram & In-App Browser Guidance Banner */}
          {isInAppBrowser && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: 'var(--space-md)',
                color: '#92400e',
                fontSize: '0.86rem',
                lineHeight: 1.5
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '4px' }}>
                <ExternalLink size={16} />
                <span>{isKm ? 'លោកអ្នកកំពុងបើកក្នុង Telegram App' : 'Opened inside Telegram App'}</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem' }}>
                {isKm
                  ? 'Google មិនអនុញ្ញាតឱ្យ Login ក្នុង Telegram ដោយសារគោលការណ៍សុវត្ថិភាព។ សូមចុចសញ្ញា (...) នៅជ្រុងខាងលើស្តាំ ហើយជ្រើសរើស "Open in Chrome" ឬ "Open in Safari"។'
                  : 'Google blocks sign-in inside Telegram. Please tap (...) in top right and choose "Open in Chrome" or "Open in Safari".'}
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Android Chrome Intent button */}
                {typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '') && (
                  <a
                    href={`intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>{isKm ? 'បើកក្នុង Google Chrome' : 'Open in Chrome'}</span>
                  </a>
                )}

                {/* Copy Link Button for iPhone & others */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    showToastMessage(isKm ? 'បានចម្លងតំណភ្ជាប់! សូមបើកក្នុង Chrome ឬ Safari រួច Paste' : 'Link copied! Open Chrome or Safari and paste it');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#ffffff',
                    color: '#92400e',
                    border: '1.5px solid #d97706',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={13} />
                  <span>{isKm ? 'ចម្លងតំណភ្ជាប់ (Copy Link)' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-md)',
                fontSize: '0.88rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-md)',
                fontSize: '0.88rem'
              }}
            >
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div
              key="login"
              className={`auth-form-viewport ${slideDirection === 'forward' ? 'auth-slide-forward' : 'auth-slide-backward'}`}
            >
              <form onSubmit={handleLoginSubmit}>
                {/* Rounded Pill Google Button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="btn-google-auth"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '10px 24px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '9999px',
                      color: '#1e293b',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: googleLoading ? 'wait' : 'pointer',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    <span>{googleLoading ? (isKm ? 'កំពុងភ្ជាប់...' : 'Connecting...') : (isKm ? 'បន្តជាមួយ Google' : 'Continue with Google')}</span>
                  </button>
                </div>

                {/* Divider */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '14px 0 16px',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                  <span style={{ padding: '0 12px', color: '#94a3b8', fontWeight: 600 }}>{isKm ? 'ឬ' : 'or'}</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                </div>

                {/* Email Field */}
                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <Mail size={16} />
                    <span>{isKm ? 'អ៊ីមែល' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="example@gmail.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-xs)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <Lock size={16} />
                    <span>{isKm ? 'ពាក្យសម្ងាត់' : 'Password'}</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      style={{ paddingRight: '44px', width: '100%' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        padding: '2px 0',
                        textDecoration: 'underline'
                      }}
                      onClick={() => {
                        setForgotEmail(loginData.email || '');
                        setError('');
                        setSuccessMsg('');
                        setMode('forgot');
                      }}
                    >
                      {isKm ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot password?'}
                    </button>
                  </div>
                </div>

                <div className="auth-field-stagger" style={{ marginTop: 'var(--space-md)' }}>
                  <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading}>
                    {loading ? (isKm ? 'កំពុងចូល...' : 'Signing in...') : (isKm ? 'ចូលគណនី' : 'Sign In')}
                  </Button>
                </div>

                <div className="auth-field-stagger" style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.88rem' }}
                    onClick={() => switchMode('register')}
                  >
                    {isKm ? 'មិនទាន់មានគណនីមែនទេ? ចុះឈ្មោះឥឡូវនេះ' : "Don't have an account? Sign up now"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE: REGISTER (Google First -> Then Fill Name, Phone, Address) */}
          {mode === 'register' && (
            <div
              key="register"
              className={`auth-form-viewport ${slideDirection === 'forward' ? 'auth-slide-forward' : 'auth-slide-backward'}`}
            >
              {/* STEP 1: Connect with Google first */}
              {registerStep === 'google' && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: '0 4px 12px rgba(185, 28, 28, 0.1)'
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                    {isKm ? 'ចុះឈ្មោះជាមួយ Google យ៉ាងរហ័ស' : 'Fast Sign-Up with Google'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '320px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    {isKm
                      ? 'ជំហានទី១៖ សូមបន្តជាមួយ Google ដើម្បីផ្ទៀងផ្ទាត់គណនី បន្ទាប់មកបំពេញឈ្មោះ លេខទូរស័ព្ទ និងអាសយដ្ឋាន'
                      : 'Step 1: Continue with Google first, then fill in your phone & delivery address'}
                  </p>

                  {/* Rounded Big Google CTA Button */}
                  <div style={{ marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '12px 24px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #e2e8f0',
                        borderRadius: '9999px',
                        color: '#0f172a',
                        fontSize: '0.96rem',
                        fontWeight: 800,
                        fontFamily: 'inherit',
                        cursor: googleLoading ? 'wait' : 'pointer',
                        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.08)';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </svg>
                      <span>{googleLoading ? (isKm ? 'កំពុងដំណើរការ...' : 'Connecting...') : (isKm ? 'បន្តជាមួយ Google ដើម្បីចុះឈ្មោះ' : 'Continue with Google')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 (AFTER GOOGLE): Fill Name, Phone, and Delivery Address */}
              {registerStep === 'details' && (
                <form onSubmit={handleGoogleRegisterComplete}>
                  {/* Google Verified User Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#f0fdf4',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {googleProfile?.picture ? (
                        <img
                          src={googleProfile.picture}
                          alt="Google Avatar"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem'
                          }}
                        >
                          G
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} />
                          <span>{googleProfile?.email}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>
                          {isKm ? 'គណនី Google បានផ្ទៀងផ្ទាត់' : 'Google Account Verified'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRegisterStep('google');
                        setGoogleProfile(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {isKm ? 'ប្តូរ' : 'Change'}
                    </button>
                  </div>

                  {/* Full Name */}
                  <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-sm)' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      <User size={16} />
                      <span>{isKm ? 'ឈ្មោះពេញ' : 'Full Name'} *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder={isKm ? 'ឧទាហរណ៍: សុខ ចាន់ដារ៉ា' : 'e.g. John Doe'}
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-sm)' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      <Phone size={16} />
                      <span>{isKm ? 'លេខទូរស័ព្ទ' : 'Phone Number'} *</span>
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      required
                      placeholder="012 345 678"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    />
                  </div>

                  {/* Delivery Address */}
                  <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-lg)' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      <MapPin size={16} />
                      <span>{isKm ? 'អាសយដ្ឋានដឹកជញ្ជូន' : 'Delivery Address'} *</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder={isKm ? 'ផ្ទះលេខ #12, ផ្លូវ 271, បឹងទំពុន...' : 'House #12, St 271, Boeng Tompun...'}
                      value={registerData.address}
                      onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                    />
                  </div>

                  <div className="auth-field-stagger">
                    <Button type="submit" variant="primary" fullWidth size="lg" disabled={googleLoading}>
                      {googleLoading ? (isKm ? 'កំពុងចុះឈ្មោះ...' : 'Completing...') : (isKm ? 'ចុះឈ្មោះ និងចាប់ផ្តើមកុម្ម៉ង់' : 'Complete Registration')}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE: VERIFY OTP */}
          {mode === 'verify' && (
            <div
              key="verify"
              className={`auth-form-viewport ${slideDirection === 'forward' ? 'auth-slide-forward' : 'auth-slide-backward'}`}
            >
              <form onSubmit={handleVerifySubmit}>
                <div style={{ textAlign: 'center', margin: 'var(--space-sm) 0 var(--space-md)' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}
                  >
                    <Mail size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '4px', fontWeight: 700 }}>
                    {isKm ? 'ពិនិត្យប្រអប់សំបុត្រ Gmail របស់អ្នក' : 'Check your Gmail Inbox'}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto', lineHeight: 1.5 }}>
                    {isKm
                      ? `យើងបានផ្ញើកូដសម្ងាត់ ៦ ខ្ទង់ទៅកាន់ ${verifyEmail}។ សូមពិនិត្យមើលប្រអប់សំបុត្រ (Inbox ឬ Spam)។`
                      : `We sent a 6-digit verification code to ${verifyEmail}. Please check your Inbox or Spam.`}
                  </p>
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

                <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading || otp.join('').length !== 6}>
                  {loading ? (isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying...') : (isKm ? 'ផ្ទៀងផ្ទាត់ និងចូលគណនី' : 'Verify & Sign In')}
                </Button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-lg)' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => switchMode('login')}
                  >
                    ← {isKm ? 'ត្រឡប់ក្រោយ' : 'Back to login'}
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
                    <span>{isKm ? 'ផ្ញើកូដម្តងទៀត' : 'Resend code'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <div key="forgot" className="auth-form-viewport auth-slide-forward">
              <form onSubmit={handleForgotSubmit}>
                <div style={{ textAlign: 'center', margin: 'var(--space-sm) 0 var(--space-md)' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}
                  >
                    <Key size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '4px', fontWeight: 700 }}>
                    {isKm ? 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ' : 'Reset Password'}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto', lineHeight: 1.5 }}>
                    {isKm
                      ? 'បញ្ចូលអ៊ីមែលគណនីរបស់អ្នក ដើម្បីទទួលលេខកូដប្តូរពាក្យសម្ងាត់'
                      : 'Enter your account email to receive a password reset code'}
                  </p>
                </div>

                <div className="form-group auth-field-stagger" style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <Mail size={16} />
                    <span>{isKm ? 'អ៊ីមែល' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="example@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading}>
                  {loading ? (isKm ? 'កំពុងផ្ញើ...' : 'Sending...') : (isKm ? 'ផ្ញើលេខកូដប្តូរពាក្យសម្ងាត់' : 'Send Reset Code')}
                </Button>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={() => {
                      setError('');
                      setSuccessMsg('');
                      setMode('login');
                    }}
                  >
                    <ArrowLeft size={15} />
                    <span>{isKm ? 'ត្រឡប់ទៅចូលគណនីវិញ' : 'Back to login'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE: RESET PASSWORD */}
          {mode === 'reset' && (
            <div key="reset" className="auth-form-viewport auth-slide-forward">
              <form onSubmit={handleResetSubmit}>
                <div style={{ textAlign: 'center', margin: 'var(--space-sm) 0 var(--space-md)' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}
                  >
                    <ShieldCheck size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '4px', fontWeight: 700 }}>
                    {isKm ? 'បង្កើតពាក្យសម្ងាត់ថ្មី' : 'Create New Password'}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto', lineHeight: 1.5 }}>
                    {isKm
                      ? `សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់ដែលបានផ្ញើទៅកាន់ ${forgotEmail} និងពាក្យសម្ងាត់ថ្មី`
                      : `Enter the 6-digit code sent to ${forgotEmail} and your new password`}
                  </p>
                </div>

                <div className="auth-otp-box" onPaste={(e) => {
                  e.preventDefault();
                  const p = e.clipboardData.getData('text').trim();
                  if (/^\d{6}$/.test(p)) {
                    setResetOtp(p.split(''));
                    resetOtpInputsRef.current[5]?.focus();
                  }
                }} style={{ marginBottom: 'var(--space-md)' }}>
                  {resetOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (resetOtpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="auth-otp-input"
                      value={digit}
                      onChange={(e) => {
                        if (!/^\d*$/.test(e.target.value)) return;
                        const n = [...resetOtp];
                        n[idx] = e.target.value.slice(-1);
                        setResetOtp(n);
                        if (e.target.value && idx < 5) resetOtpInputsRef.current[idx + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !resetOtp[idx] && idx > 0) resetOtpInputsRef.current[idx - 1]?.focus();
                      }}
                    />
                  ))}
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <Lock size={16} />
                    <span>{isKm ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: '44px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <Lock size={16} />
                    <span>{isKm ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm Password'}</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '44px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading}>
                  {loading ? (isKm ? 'កំពុងប្តូរ...' : 'Updating...') : (isKm ? 'ប្តូរពាក្យសម្ងាត់' : 'Reset Password')}
                </Button>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => switchMode('login')}
                  >
                    ← {isKm ? 'ត្រឡប់ទៅចូលគណនីវិញ' : 'Back to login'}
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
