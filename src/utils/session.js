export const generateSessionId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

export const getSessionId = () => localStorage.getItem('sessionId');
export const setSessionId = (id) => localStorage.setItem('sessionId', id);
export const clearSession = () => localStorage.removeItem('sessionId');

// Append ?sid=xxx to any path
export const sid = (path) => {
  const sessionId = getSessionId();
  if (!sessionId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}sid=${sessionId}`;
};
