import Cookies from 'js-cookie';

export interface User {
  id: number; emp_id: string; name: string;
  email: string; dept: string; role: 'admin' | 'employee';
}

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const u = Cookies.get('td_user');
  return u ? JSON.parse(u) : null;
};

export const getToken = () => Cookies.get('td_token') || null;

export const setAuth = (token: string, user: User) => {
  Cookies.set('td_token', token, { expires: 1 });
  Cookies.set('td_user', JSON.stringify(user), { expires: 1 });
};

export const clearAuth = () => {
  Cookies.remove('td_token');
  Cookies.remove('td_user');
};

export const isLoggedIn = () => !!getToken();
export const isAdmin    = () => getUser()?.role === 'admin';
