const KEYS = {
  users: "vibely_users",
  posts: "vibely_posts",
  messages: "vibely_messages",
  notifications: "vibely_notifications",
  session: "vibely_current_user"
};

export function read(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
export function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
export const getUsers = () => read(KEYS.users, []);
export const saveUsers = value => write(KEYS.users, value);
export const getPosts = () => read(KEYS.posts, []);
export const savePosts = value => write(KEYS.posts, value);
export const getMessages = () => read(KEYS.messages, []);
export const saveMessages = value => write(KEYS.messages, value);
export const getNotifications = () => read(KEYS.notifications, []);
export const saveNotifications = value => write(KEYS.notifications, value);
export const getSession = () => localStorage.getItem(KEYS.session);
export const setSession = id => localStorage.setItem(KEYS.session, String(id));
export const clearSession = () => localStorage.removeItem(KEYS.session);
export const KEYS_PUBLIC = KEYS;
