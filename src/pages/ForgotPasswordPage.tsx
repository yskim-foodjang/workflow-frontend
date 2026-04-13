import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { APP_NAME } from '@/config/app';
import api from '@/utils/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('이메일을 입력해주세요.'); return; }

    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setDone(true);
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'EMAIL_FAILED') {
        toast.error('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        toast.error('오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">이메일을 확인하세요</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.<br/>
                1시간 이내에 링크를 클릭하세요.
              </p>
              <Link to="/login" className="btn-primary block text-center">
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">비밀번호 찾기</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                가입한 이메일 주소를 입력하시면 재설정 링크를 보내드립니다.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="name@company.com"
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      발송 중...
                    </>
                  ) : '재설정 링크 발송'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
            ← 로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
