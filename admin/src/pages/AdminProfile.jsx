import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Save,
  Clock,
  Activity,
  Users,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { Button } from '../components/common/Button';

export const AdminProfile = () => {
  const { user, updateProfile } = useAuth();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'security' | 'activity' | 'admins'

  // Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // My Activity Logs State
  const [myLogs, setMyLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // All Admins State
  const [allAdmins, setAllAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  // Load My Activity Logs
  useEffect(() => {
    if (activeTab === 'activity') {
      const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
          const res = await apiService.getAuditLogs();
          if (res && res.success && Array.isArray(res.data)) {
            const myName = (user?.name || '').toLowerCase().trim();
            const myEmail = (user?.email || '').toLowerCase().trim();
            const filtered = res.data.filter((l) => {
              const logName = (l.adminName || '').toLowerCase().trim();
              const logEmail = (l.adminEmail || '').toLowerCase().trim();
              return (
                (myEmail && logEmail === myEmail) ||
                (myName && logName.includes(myName)) ||
                (myName && myName.includes(logName))
              );
            });
            setMyLogs(filtered);
          }
        } catch (_) {}
        setLoadingLogs(false);
      };
      fetchLogs();
    }
  }, [activeTab, user]);

  // Load All Admins
  useEffect(() => {
    if (activeTab === 'admins') {
      const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
          const res = await apiService.getAdmins();
          if (res && res.success && Array.isArray(res.data)) {
            setAllAdmins(res.data);
          }
        } catch (_) {}
        setLoadingAdmins(false);
      };
      fetchAdmins();
    }
  }, [activeTab]);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(isKm ? 'សូមបញ្ចូលឈ្មោះរបស់អ្នក' : 'Please enter your name', 'warning');
      return;
    }
    setIsSavingInfo(true);
    const res = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim()
    });
    setIsSavingInfo(false);

    if (res.success) {
      showToast(isKm ? 'បានកែប្រែព័ត៌មានប្រវត្តិរូបជោគជ័យ!' : 'Profile updated successfully!', 'success');
    } else {
      showToast(res.error || (isKm ? 'មិនអាចកែប្រែបានទេ' : 'Could not update profile'), 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast(isKm ? 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current password is required', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast(isKm ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ ខ្ទង់' : 'New password must be at least 6 characters', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(isKm ? 'ពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់មិនត្រូវគ្នាទេ' : 'Passwords do not match', 'warning');
      return;
    }

    setIsChangingPass(true);
    const res = await updateProfile({
      currentPassword,
      newPassword
    });
    setIsChangingPass(false);

    if (res.success) {
      showToast(isKm ? 'បានផ្លាស់ប្តូរពាក្យសម្ងាត់ជោគជ័យ!' : 'Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(res.error || (isKm ? 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ' : 'Incorrect current password'), 'error');
    }
  };

  const formatLogDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return d.toLocaleString(isKm ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return String(dateVal);
    }
  };

  const getInitials = (str) => {
    if (!str) return 'A';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-topbar__title">{isKm ? 'ប្រវត្តិរូប Admin' : 'Admin Profile'}</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            {isKm ? 'គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន និងសុវត្ថិភាពគណនី Admin របស់អ្នក' : 'Manage your administrator account details and security'}
          </p>
        </div>
      </div>

      <div className="admin-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Profile Header Hero Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #881337 0%, #be123c 50%, #e11d48 100%)',
            borderRadius: '20px',
            padding: '28px 32px',
            color: '#ffffff',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 10px 25px -5px rgba(190, 18, 60, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Avatar Pill */}
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '3px solid rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                flexShrink: 0
              }}
            >
              {getInitials(user?.name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                  {user?.name || 'Administrator'}
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={14} />
                  {isKm ? 'អ្នកគ្រប់គ្រងទូទៅ' : 'System Admin'}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} />
                <span>{user?.email || 'admin@phumyeung.com'}</span>
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '10px 18px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}
          >
            <CheckCircle2 size={18} color="#86efac" />
            <span>{isKm ? 'គណនីមានសុពលភាព' : 'Verified & Active'}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            style={{
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'info' ? 'var(--color-primary, #b91c1c)' : '#64748b',
              borderBottom: activeTab === 'info' ? '3px solid var(--color-primary, #b91c1c)' : '3px solid transparent',
              marginBottom: '-3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <User size={16} />
            <span>{isKm ? 'ព័ត៌មានគណនី' : 'Profile Details'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            style={{
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'security' ? 'var(--color-primary, #b91c1c)' : '#64748b',
              borderBottom: activeTab === 'security' ? '3px solid var(--color-primary, #b91c1c)' : '3px solid transparent',
              marginBottom: '-3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={16} />
            <span>{isKm ? 'សុវត្ថិភាព & ពាក្យសម្ងាត់' : 'Security & Password'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            style={{
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'activity' ? 'var(--color-primary, #b91c1c)' : '#64748b',
              borderBottom: activeTab === 'activity' ? '3px solid var(--color-primary, #b91c1c)' : '3px solid transparent',
              marginBottom: '-3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={16} />
            <span>{isKm ? 'សកម្មភាពរបស់ខ្ញុំ' : 'My Activity Logs'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            style={{
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'admins' ? 'var(--color-primary, #b91c1c)' : '#64748b',
              borderBottom: activeTab === 'admins' ? '3px solid var(--color-primary, #b91c1c)' : '3px solid transparent',
              marginBottom: '-3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={16} />
            <span>{isKm ? 'ក្រុម Admin ទាំងអស់' : 'All Administrators'}</span>
          </button>
        </div>

        {/* Tab 1: Profile Information */}
        {activeTab === 'info' && (
          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {isKm ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Information'}
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: '#64748b' }}>
              {isKm
                ? 'ឈ្មោះនេះនឹងបង្ហាញនៅលើរាល់មុខម្ហូបដែលអ្នកបានបង្កើត ឬកែប្រែ។'
                : 'Your name will appear as author on dishes you create or edit.'}
            </p>

            <form onSubmit={handleSaveInfo}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {isKm ? 'ឈ្មោះពេញ' : 'Full Name'} *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Him Lihour"
                      style={{ paddingLeft: '40px' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {isKm ? 'អ៊ីមែលចូលប្រើ (Read-Only)' : 'Login Email (Read-Only)'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ''}
                      disabled
                      style={{ paddingLeft: '40px', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {isKm ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 012 345 678"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {isKm ? 'អាសយដ្ឋាន / សាខា' : 'Address / Branch'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="form-input"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Phnom Penh"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Button variant="primary" type="submit" disabled={isSavingInfo} icon={<Save size={16} />}>
                  {isSavingInfo ? (isKm ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKm ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'security' && (
          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {isKm ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password'}
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: '#64748b' }}>
              {isKm
                ? 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន និងពាក្យសម្ងាត់ថ្មីយ៉ាងតិច ៦ ខ្ទង់។'
                : 'Enter your current password and a new password with at least 6 characters.'}
            </p>

            <form onSubmit={handleChangePassword} style={{ maxWidth: '480px' }}>
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {isKm ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {isKm ? 'ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៦ ខ្ទង់)' : 'New Password (min 6 characters)'} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {isKm ? 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'} *
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button variant="primary" type="submit" disabled={isChangingPass} icon={<KeyRound size={16} />}>
                {isChangingPass ? (isKm ? 'កំពុងផ្លាស់ប្តូរ...' : 'Updating...') : (isKm ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Update Password')}
              </Button>
            </form>
          </div>
        )}

        {/* Tab 3: My Activity Logs */}
        {activeTab === 'activity' && (
          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {isKm ? 'ប្រវត្តិសកម្មភាពរបស់ខ្ញុំ' : 'My Audit History'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b' }}>
              {isKm
                ? 'កំណត់ហេតុសកម្មភាពដែលអ្នកបានបង្កើត កែប្រែ ឬប្តូរស្ថានភាពលក់មុខម្ហូប។'
                : 'History of dish creations, edits, and stock toggles performed by your account.'}
            </p>

            {loadingLogs ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                {isKm ? 'កំពុងទាញយកកំណត់ហេតុ...' : 'Loading your activity...'}
              </p>
            ) : myLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Activity size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>{isKm ? 'មិនទាន់មានប្រវត្តិសកម្មភាពត្រូវបានកត់ត្រានៅឡើយទេ' : 'No activity recorded yet for your account.'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myLogs.map((log) => (
                  <div
                    key={log._id || log.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            backgroundColor:
                              log.action === 'create_dish'
                                ? '#dcfce7'
                                : log.action === 'delete_dish'
                                ? '#fee2e2'
                                : '#e0f2fe',
                            color:
                              log.action === 'create_dish'
                                ? '#15803d'
                                : log.action === 'delete_dish'
                                ? '#b91c1c'
                                : '#0369a1',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        >
                          {log.action?.replace('_', ' ')}
                        </span>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{log.targetName || 'Dish'}</strong>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#475569' }}>{log.details}</div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      <span>{formatLogDate(log.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: All Administrators */}
        {activeTab === 'admins' && (
          <div className="admin-card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {isKm ? 'ក្រុមអ្នកគ្រប់គ្រងភោជនីយដ្ឋាន' : 'Restaurant Administrators Team'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b' }}>
              {isKm
                ? 'បញ្ជីគណនី Admin ទាំងអស់ក្នុងប្រព័ន្ធ ដែលមានសិទ្ធិគ្រប់គ្រង និងបន្ថែមមុខម្ហូប។'
                : 'All administrators authorized to manage products, categories, orders, and settings.'}
            </p>

            {loadingAdmins ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                {isKm ? 'កំពុងទាញយកបញ្ជី Admin...' : 'Loading administrators...'}
              </p>
            ) : allAdmins.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                {isKm ? 'រកមិនឃើញគណនី Admin ទេ' : 'No admin accounts found.'}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {allAdmins.map((adm) => {
                  const isCurrent =
                    (user?.email && adm.email?.toLowerCase() === user.email.toLowerCase()) ||
                    (user?.id && String(adm._id) === String(user.id));

                  return (
                    <div
                      key={adm._id}
                      style={{
                        border: isCurrent ? '2px solid var(--color-primary, #b91c1c)' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        backgroundColor: isCurrent ? '#fff1f2' : '#ffffff',
                        position: 'relative',
                        boxShadow: isCurrent ? '0 4px 12px rgba(185, 28, 28, 0.1)' : 'none'
                      }}
                    >
                      {isCurrent && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            backgroundColor: 'var(--color-primary, #b91c1c)',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}
                        >
                          {isKm ? 'គណនីបច្ចុប្បន្ន' : 'Current Session'}
                        </span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: isCurrent ? 'var(--color-primary, #b91c1c)' : '#e2e8f0',
                            color: isCurrent ? '#ffffff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 800,
                            flexShrink: 0
                          }}
                        >
                          {getInitials(adm.name)}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                            {adm.name}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                            ● {isKm ? 'Admin សកម្ម' : 'Active Admin'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} color="#94a3b8" />
                          <span>{adm.email}</span>
                        </div>
                        {adm.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={14} color="#94a3b8" />
                            <span>{adm.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

