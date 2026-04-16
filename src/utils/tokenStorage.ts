// autoLogin=true  → localStorage  (브라우저 닫아도 유지)
// autoLogin=false → sessionStorage (탭/브라우저 닫으면 사라짐)

export function getAccessToken(): string | null {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
}

export function setTokens(access: string, refresh: string, persist: boolean) {
  if (persist) {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  } else {
    sessionStorage.setItem('accessToken', access);
    sessionStorage.setItem('refreshToken', refresh);
  }
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

/** 현재 토큰이 localStorage에 있는지 (=자동로그인으로 저장된 토큰인지) */
export function isTokenPersisted(): boolean {
  return localStorage.getItem('accessToken') !== null;
}
