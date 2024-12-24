export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('email');
  localStorage.removeItem('logoutExpiration');
  const router = useRouter();
  router.push('/'); 
};

export const setLogoutTimer = () => {
  const expiration = new Date().getTime() + 24 * 60 * 60 * 1000; 
  localStorage.setItem('logoutExpiration', expiration);
};

export const checkLogout = () => {
  const expiration = localStorage.getItem('logoutExpiration');
  if (expiration && new Date().getTime() > expiration) {
    logout();
  }
};