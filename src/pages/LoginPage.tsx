import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { APP_NAME, APP_DESCRIPTION } from '@/config/app';
import toast from 'react-hot-toast';

const SAVED_EMAIL_KEY = 'wf_saved_email';
const SAVE_ID_KEY = 'wf_save_id';
const AUTO_LOGIN_KEY = 'wf_auto_login';
const EMAIL_HISTORY_KEY = 'wf_email_history';

function getSavedEmails(): string[] {
  try { return JSON.parse(localStorage.getItem(EMAIL_HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveEmailToHistory(email: string) {
  const prev = getSavedEmails().filter((e) => e !== email);
  localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify([email, ...prev].slice(0, 5)));
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [emailHistory, setEmailHistory] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    const isSaveId = localStorage.getItem(SAVE_ID_KEY) === 'true';
    const isAutoLogin = localStorage.getItem(AUTO_LOGIN_KEY) === 'true';
    if (isSaveId && savedEmail) setEmail(savedEmail);
    setSaveId(isSaveId);
    setAutoLogin(isAutoLogin);
    setEmailHistory(getSavedEmails());

    // Close dropdown on outside click
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('이메일과 비밀번호를 입력해주세요.'); return; }

    setIsSubmitting(true);
    try {
      await login(email, password);

      // 아이디 저장
      if (saveId) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
        localStorage.setItem(SAVE_ID_KEY, 'true');
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
        localStorage.setItem(SAVE_ID_KEY, 'false');
      }

      // 자동로그인
      localStorage.setItem(AUTO_LOGIN_KEY, autoLogin ? 'true' : 'false');

      // 이메일 히스토리 저장
      saveEmailToHistory(email);

      toast.success('로그인되었습니다.');
      navigate('/dashboard');
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'PENDING_APPROVAL') toast.error('관리자 승인 대기 중입니다.');
      else if (code === 'REJECTED') toast.error('가입이 거절되었습니다. 관리자에게 문의하세요.');
      else toast.error('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectHistory = (e: string) => {
    setEmail(e);
    setShowHistory(false);
    emailRef.current?.focus();
  };

  const removeHistory = (e: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    const next = emailHistory.filter((h) => h !== e);
    setEmailHistory(next);
    localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        aria-label="테마 전환"
      >
        {theme === 'light' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{APP_NAME}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{APP_DESCRIPTION}</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                이메일
              </label>
              <div className="relative" ref={dropdownRef}>
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => emailHistory.length > 0 && setShowHistory(true)}
                  className="input-field w-full"
                  placeholder="name@company.com"
                  autoComplete="off"
                  autoFocus
                />
                {showHistory && emailHistory.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
                    {emailHistory.map((h) => (
                      <div
                        key={h}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                        onMouseDown={() => selectHistory(h)}
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300">{h}</span>
                        <button
                          type="button"
                          onMouseDown={(e) => removeHistory(h, e)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
            </div>

            {/* 아이디 저장 / 자동로그인 */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveId}
                  onChange={(e) => setSaveId(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">아이디 저장</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">자동로그인</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  로그인 중...
                </>
              ) : '로그인'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              비밀번호를 잊으셨나요? 관리자에게 문의하세요.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
