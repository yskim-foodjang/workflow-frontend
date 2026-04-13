import { QRCodeSVG } from 'qrcode.react';
import { APP_NAME, APP_DESCRIPTION, BRAND_COLOR } from '@/config/app';

const APP_URL = window.location.origin;

const steps = {
  ios: [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      text: 'iPhone에서 Safari로 이 페이지를 열어주세요',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      text: '하단 가운데 공유 버튼(□↑)을 탭하세요',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
        </svg>
      ),
      text: '스크롤해서 "홈 화면에 추가"를 탭하세요',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
        </svg>
      ),
      text: '오른쪽 위 "추가"를 탭하면 설치 완료!',
    },
  ],
  android: [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      text: 'Android에서 Chrome으로 이 페이지를 열어주세요',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
          <circle cx="12" cy="5" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
        </svg>
      ),
      text: '우측 상단 메뉴(⋮)를 탭하세요',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      text: '"홈 화면에 추가" 또는 "앱 설치"를 탭하세요',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
        </svg>
      ),
      text: '"추가" 버튼을 탭하면 설치 완료!',
    },
  ],
};

function StepList({ steps: stepList }: { steps: typeof steps.ios }) {
  return (
    <ol className="space-y-4">
      {stepList.map((step, i) => (
        <li key={i} className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
            {i + 1}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-slate-400 dark:text-slate-500">{step.icon}</span>
            <p className="text-sm text-slate-700 dark:text-slate-300">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: BRAND_COLOR }}>
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{APP_NAME}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{APP_DESCRIPTION}</p>
        </div>

        {/* QR Code */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">QR코드로 접속하기</p>
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-xl inline-block shadow-sm">
              <QRCodeSVG
                value={APP_URL}
                size={180}
                fgColor="#1e293b"
                bgColor="#ffffff"
                level="M"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 break-all">{APP_URL}</p>
        </div>

        {/* iOS */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <h2 className="font-semibold text-slate-900 dark:text-white">아이폰 설치 방법</h2>
          </div>
          <StepList steps={steps.ios} />
        </div>

        {/* Android */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="currentColor">
              <path d="M17.523 15.341a1 1 0 01-.65-.238l-1.06-.93a5.95 5.95 0 01-3.813 0l-1.06.93a1 1 0 01-1.32-1.504l.537-.47A5.97 5.97 0 019 12 6 6 0 1121 12c0 .734-.133 1.438-.378 2.089l.562.49a1 1 0 01-.661 1.762zM8.5 11a1 1 0 100 2 1 1 0 000-2zm7 0a1 1 0 100 2 1 1 0 000-2zM6.758 4.454l1.077 1.077A5.97 5.97 0 0112 6c1.47 0 2.814.528 3.853 1.4l.913-.913a.75.75 0 011.06 1.06l-.94.94A5.963 5.963 0 0118 12H6a5.963 5.963 0 011.114-3.513l-.94-.94a.75.75 0 011.06-1.06l.524.524z"/>
            </svg>
            <h2 className="font-semibold text-slate-900 dark:text-white">안드로이드 설치 방법</h2>
          </div>
          <StepList steps={steps.android} />
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          설치 후 앱처럼 사용할 수 있습니다 · 별도 앱 스토어 설치 불필요
        </p>
      </div>
    </div>
  );
}
