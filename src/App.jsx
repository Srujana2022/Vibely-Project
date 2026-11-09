import { useEffect, useMemo, useState } from "react";
import {
  Home, Search, UserRound, Settings, LogOut, ShieldCheck, Users,
  MessageCircle, Bell, Heart, ImagePlus, Video, Trash2, Pencil,
  Send, LayoutDashboard, X, Menu, Camera
} from "lucide-react";
import {
  getUsers, saveUsers, getPosts, savePosts, getMessages, saveMessages,
  getNotifications, saveNotifications, getSession, setSession, clearSession
} from "./storage";

const ADMIN = { id: "vibely-admin", username: "admin", password: "admin123", role: "admin", email: "admin@vibely.demo" };
const blankUser = (id, username, email, password, bio, photo) => ({
  id, username, email, password, bio, photo, role: "user", followers: [], following: [], createdAt: Date.now()
});
const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "V")}&background=172a46&color=f3ede5`;
const fmt = value => new Date(value).toLocaleString();

function fileToData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [users, setUsers] = useState(getUsers);
  const [posts, setPosts] = useState(getPosts);
  const [messages, setMessages] = useState(getMessages);
  const [notifications, setNotifications] = useState(getNotifications);
  const [current, setCurrent] = useState(() => {
    const id = getSession();
    if (id === ADMIN.id) return ADMIN;
    return getUsers().find(u => String(u.id) === String(id)) || null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("home");
  const [query, setQuery] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { saveUsers(users); }, [users]);
  useEffect(() => { savePosts(posts); }, [posts]);
  useEffect(() => { saveMessages(messages); }, [messages]);
  useEffect(() => { saveNotifications(notifications); }, [notifications]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const isAdmin = current?.role === "admin";
  const myPosts = useMemo(() => posts.filter(p => String(p.userId) === String(current?.id)), [posts, current]);
  const notify = (userId, text) => setNotifications(old => [
    { id: Date.now() + Math.random(), userId, text, createdAt: Date.now(), read: false }, ...old
  ]);

  function login(username, password) {
    if (username.trim().toLowerCase() === ADMIN.username && password === ADMIN.password) {
      setCurrent(ADMIN); setSession(ADMIN.id); setPage("admin"); setToast("Admin login successful."); return;
    }
    const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (!found) { setToast("Incorrect username or password."); return; }
    setCurrent(found); setSession(found.id); setPage("home"); setToast("Welcome to Vibely!");
  }
  function signup(data) {
    if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) return setToast("Username already exists.");
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) return setToast("Email is already registered.");
    const user = blankUser(Date.now(), data.username, data.email, data.password, data.bio, data.photo);
    setUsers(old => [...old, user]); setAuthMode("login"); setToast("Account created. Please log in.");
  }
  function logout() { clearSession(); setCurrent(null); setPage("home"); setActiveChat(null); }
  function updateUser(updated) {
    setUsers(old => old.map(u => String(u.id) === String(updated.id) ? updated : u));
    if (String(current.id) === String(updated.id)) setCurrent(updated);
  }
  function follow(user) {
    const me = users.find(u => String(u.id) === String(current.id));
    if (!me) return;
    const following = me.following || [];
    const already = following.some(id => String(id) === String(user.id));
    const nextMe = { ...me, following: already ? following.filter(id => String(id) !== String(user.id)) : [...following, user.id] };
    const nextTarget = { ...user, followers: already
      ? (user.followers || []).filter(id => String(id) !== String(current.id))
      : [...(user.followers || []), current.id] };
    updateUser(nextMe); setUsers(old => old.map(u => String(u.id) === String(user.id) ? nextTarget : String(u.id) === String(me.id) ? nextMe : u));
    if (!already) notify(user.id, `${current.username} started following you.`);
    setToast(already ? "Unfollowed." : "Following!");
  }
  function createPost(text, media, mediaType) {
    if (!text.trim() && !media) return setToast("Write something or attach a photo/video.");
    setPosts(old => [{ id: Date.now(), userId: current.id, text: text.trim(), media, mediaType, likes: [], comments: [], createdAt: Date.now() }, ...old]);
    setToast("Post shared!");
  }
  function toggleLike(post) {
    const liked = (post.likes || []).includes(current.id);
    setPosts(old => old.map(p => p.id === post.id ? { ...p, likes: liked ? p.likes.filter(id => id !== current.id) : [...(p.likes || []), current.id] } : p));
    if (!liked && String(post.userId) !== String(current.id)) notify(post.userId, `${current.username} liked your post.`);
  }
  function addComment(post, text) {
    if (!text.trim()) return;
    setPosts(old => old.map(p => p.id === post.id ? { ...p, comments: [...(p.comments || []), { id: Date.now(), userId: current.id, text: text.trim() }] } : p));
    if (String(post.userId) !== String(current.id)) notify(post.userId, `${current.username} commented on your post.`);
  }
  function removePost(id) { setPosts(old => old.filter(p => p.id !== id)); setToast("Post deleted."); }
  function removeUser(id) {
    setUsers(old => old.filter(u => String(u.id) !== String(id)));
    setPosts(old => old.filter(p => String(p.userId) !== String(id)));
    setToast("User and their posts removed.");
  }
  function sendMessage(receiverId, text) {
    if (!text.trim()) return;
    setMessages(old => [...old, { id: Date.now(), senderId: current.id, receiverId, text: text.trim(), createdAt: Date.now() }]);
  }

  if (!current) return <Auth mode={authMode} setMode={setAuthMode} onLogin={login} onSignup={signup} toast={toast} />;
  const navItems = isAdmin
    ? [{ id: "admin", label: "Dashboard", icon: LayoutDashboard }, { id: "adminUsers", label: "Manage Users", icon: Users }, { id: "adminPosts", label: "Manage Posts", icon: ImagePlus }]
    : [{ id: "home", label: "Home", icon: Home }, { id: "discover", label: "Discover", icon: Search }, { id: "messages", label: "Messages", icon: MessageCircle }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "profile", label: "My Profile", icon: UserRound }, { id: "settings", label: "Settings", icon: Settings }];
  const title = navItems.find(n => n.id === page)?.label || (page === "profile" ? "My Profile" : "Vibely");

  return <div className="app-shell">
    <header className="topbar">
      <button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu /></button>
      <div className="brand"><span className="brand-mark">V</span><span>VIBELY</span></div>
      <div className="topbar-right">
        {!isAdmin && <input className="top-search" placeholder="Search people..." value={query} onChange={e => { setQuery(e.target.value); setPage("discover"); }} />}
        <span className="signed-in">{isAdmin ? "Administrator" : `@${current.username}`}</span>
        <button className="icon-btn" title="Logout" onClick={logout}><LogOut size={19}/></button>
      </div>
    </header>
    <div className="layout">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="side-label">{isAdmin ? "ADMIN MODULE" : "USER MODULE"}</div>
        {navItems.map(item => <button key={item.id} className={`nav-item ${page === item.id ? "selected" : ""}`} onClick={() => { setPage(item.id); setMobileNav(false); }}>
          <item.icon size={18}/>{item.label}
        </button>)}
        <div className="sidebar-bottom"><div className="mini-avatar">{isAdmin ? "A" : current.username[0].toUpperCase()}</div><div><b>{current.username}</b><small>{isAdmin ? "Admin account" : "Vibely member"}</small></div></div>
      </aside>
      <main className="main-content">
        <div className="page-heading"><div><p className="eyebrow">{isAdmin ? "CONTROL PANEL" : "CONNECT • SHARE • DISCOVER"}</p><h1>{title}</h1></div></div>
        {page === "home" && !isAdmin && <HomePage current={current} users={users} posts={posts} onCreate={createPost} onLike={toggleLike} onComment={addComment} onDelete={removePost} />}
        {page === "discover" && !isAdmin && <Discover users={users} current={current} query={query} onQuery={setQuery} onFollow={follow} />}
        {page === "profile" && !isAdmin && <Profile current={current} posts={myPosts} onSave={updateUser} />}
        {page === "settings" && !isAdmin && <SettingsPage current={current} onSave={updateUser} />}
        {page === "notifications" && !isAdmin && <Notifications items={notifications.filter(n => String(n.userId) === String(current.id))} />}
        {page === "messages" && !isAdmin && <Messages current={current} users={users.filter(u => String(u.id) !== String(current.id))} messages={messages} activeChat={activeChat} setActiveChat={setActiveChat} onSend={sendMessage} />}
        {page === "admin" && isAdmin && <AdminDashboard users={users} posts={posts} />}
        {page === "adminUsers" && isAdmin && <AdminUsers users={users} onDelete={removeUser} />}
        {page === "adminPosts" && isAdmin && <AdminPosts posts={posts} users={users} onDelete={removePost} />}
      </main>
    </div>
    {toast && <div className="toast">{toast}</div>}
    <footer>Vibely © 2026 · Connect · Share · Discover</footer>
  </div>;
}

function Auth({ mode, setMode, onLogin, onSignup, toast }) {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "", bio: "", photo: "" });
  const [error, setError] = useState("");
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));
  async function submitSignup(e) {
    e.preventDefault(); setError("");
    if (!form.username.trim() || !form.email.trim() || !form.password) return setError("Please complete all required fields.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must contain at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    onSignup(form);
  }
  return <div className="auth-screen"><div className="auth-card">
    <div className="auth-logo">V</div><h1>VIBELY</h1><p className="auth-tag">Connect · Share · Discover</p>
    <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Login</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Create Account</button></div>
    {mode === "login" ? <form onSubmit={e => { e.preventDefault(); onLogin(loginData.username, loginData.password); }}>
      <Field label="Username"><input required value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} placeholder="Enter username"/></Field>
      <Field label="Password"><input required type="password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} placeholder="Enter password"/></Field>
      <button className="primary full">Login</button>
      <p className="demo-hint">Admin demo: <b>admin</b> / <b>admin123</b></p>
    </form> : <form onSubmit={submitSignup}>
      <Field label="Profile picture (optional)"><input type="file" accept="image/*" onChange={async e => { if (e.target.files[0]) set("photo", await fileToData(e.target.files[0])); }}/></Field>
      <Field label="Email"><input required type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com"/></Field>
      <Field label="Username"><input required value={form.username} onChange={e => set("username", e.target.value)} placeholder="Choose a username"/></Field>
      <Field label="Password"><input required type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="At least 6 characters"/></Field>
      <Field label="Confirm password"><input required type="password" value={form.confirm} onChange={e => set("confirm", e.target.value)} placeholder="Repeat password"/></Field>
      <Field label="Bio"><textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Tell people about yourself"/></Field>
      <button className="primary full">Create Account</button>
    </form>}
    {(error || toast) && <p className="form-message">{error || toast}</p>}
    <p className="local-note">Demo application · Account data is saved in this browser.</p>
  </div></div>;
}
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }

function HomePage({ current, users, posts, onCreate, onLike, onComment, onDelete }) {
  const [text, setText] = useState(""); const [media, setMedia] = useState(""); const [mediaType, setMediaType] = useState("");
  const [fileName, setFileName] = useState("");
  async function chooseFile(file) { if (!file) return; setMedia(await fileToData(file)); setMediaType(file.type.startsWith("video/") ? "video" : "image"); setFileName(file.name); }
  return <div className="feed-layout"><section className="feed-column">
    <div className="composer panel"><div className="composer-row"><img className="avatar" src={current.photo || avatar(current.username)}/><textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your mind?"/></div>
      {media && <div className="media-preview">{mediaType === "video" ? <video src={media} controls/> : <img src={media}/>}<button className="tiny-remove" onClick={() => { setMedia(""); setMediaType(""); setFileName(""); }}><X size={16}/></button></div>}
      <div className="composer-actions"><label className="upload-label"><ImagePlus size={17}/> Photo / Video<input hidden type="file" accept="image/*,video/*" onChange={e => chooseFile(e.target.files[0])}/></label><button className="primary" onClick={() => { onCreate(text, media, mediaType); setText(""); setMedia(""); setMediaType(""); setFileName(""); }}>Share post</button></div>
    </div>
    {posts.length === 0 ? <div className="empty panel"><h3>Welcome to Vibely!</h3><p>Be the first to share something with your community.</p></div> : posts.map(post => <Post key={post.id} post={post} users={users} current={current} onLike={onLike} onComment={onComment} onDelete={onDelete}/>)}
  </section><aside className="suggestion-column panel"><h3>People to discover</h3>{users.filter(u => u.id !== current.id && !(current.following || []).includes(u.id)).slice(0,6).map(u => <div className="suggestion" key={u.id}><img className="avatar small" src={u.photo || avatar(u.username)}/><div><b>{u.username}</b><small>{(u.followers || []).length} followers</small></div></div>)}{users.length <= 1 && <p className="muted">New members will appear here.</p>}</aside></div>;
}
function Post({ post, users, current, onLike, onComment, onDelete }) {
  const [comment, setComment] = useState("");
  const author = users.find(u => String(u.id) === String(post.userId));
  if (!author) return null;
  const liked = (post.likes || []).includes(current.id);
  return <article className="post panel"><div className="post-head"><img className="avatar" src={author.photo || avatar(author.username)}/><div><b>{author.username}</b><small>{fmt(post.createdAt)}</small></div>{String(post.userId) === String(current.id) && <button className="icon-btn post-delete" title="Delete post" onClick={() => onDelete(post.id)}><Trash2 size={17}/></button>}</div>
    {post.text && <p className="post-copy">{post.text}</p>}
    {post.media && (post.mediaType === "video" ? <video className="post-media" src={post.media} controls/> : <img className="post-media" src={post.media}/>)}
    <div className="post-actions"><button className={liked ? "liked" : ""} onClick={() => onLike(post)}><Heart size={17} fill={liked ? "currentColor" : "none"}/> {post.likes?.length || 0} Likes</button><span><MessageCircle size={17}/> {post.comments?.length || 0} Comments</span></div>
    <div className="comments">{(post.comments || []).map(c => <p key={c.id}><b>{users.find(u => String(u.id) === String(c.userId))?.username || "User"}</b> {c.text}</p>)}</div>
    <form className="comment-form" onSubmit={e => { e.preventDefault(); onComment(post, comment); setComment(""); }}><input value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment..."/><button aria-label="Send comment"><Send size={17}/></button></form>
  </article>;
}
function Discover({ users, current, query, onQuery, onFollow }) {
  const found = users.filter(u => String(u.id) !== String(current.id) && u.username.toLowerCase().includes(query.toLowerCase()));
  return <div className="panel padded"><input className="search-input" value={query} onChange={e => onQuery(e.target.value)} placeholder="Search by username..."/>{found.length ? found.map(u => {
    const following = (current.following || []).some(id => String(id) === String(u.id));
    return <div className="person-row" key={u.id}><img className="avatar" src={u.photo || avatar(u.username)}/><div className="person-info"><b>{u.username}</b><small>{u.bio || "Vibely member"} · {(u.followers || []).length} followers</small></div><button className={following ? "secondary" : "primary"} onClick={() => onFollow(u)}>{following ? "Following" : "Follow"}</button></div>;
  }) : <p className="muted">No users found.</p>}</div>;
}
function Profile({ current, posts, onSave }) {
  const [username, setUsername] = useState(current.username); const [bio, setBio] = useState(current.bio || ""); const [photo, setPhoto] = useState(current.photo || ""); const [saved, setSaved] = useState(false);
  return <div className="panel padded profile-panel"><div className="profile-cover"/><div className="profile-details"><img className="avatar profile-avatar" src={photo || avatar(username)}/><div><h2>{current.username}</h2><p>{current.bio || "No bio yet."}</p></div></div>
    <div className="stats"><div><b>{posts.length}</b><span>Posts</span></div><div><b>{current.followers?.length || 0}</b><span>Followers</span></div><div><b>{current.following?.length || 0}</b><span>Following</span></div></div>
    <h3 className="section-title">Edit profile</h3><Field label="Username"><input value={username} onChange={e => setUsername(e.target.value)}/></Field><Field label="Bio"><textarea value={bio} onChange={e => setBio(e.target.value)}/></Field><Field label="Profile picture"><input type="file" accept="image/*" onChange={async e => { if (e.target.files[0]) setPhoto(await fileToData(e.target.files[0])); }}/></Field><button className="primary" onClick={() => { onSave({ ...current, username: username.trim() || current.username, bio, photo }); setSaved(true); }}>Save profile</button>{saved && <span className="success-text">Profile saved.</span>}
    <h3 className="section-title">My posts</h3><div className="profile-posts">{posts.map(p => <div className="profile-tile" key={p.id}>{p.media ? (p.mediaType === "video" ? <video src={p.media}/> : <img src={p.media}/>) : <p>{p.text}</p>}</div>)}</div>
  </div>;
}
function SettingsPage({ current, onSave }) {
  const [password, setPassword] = useState(""); const [message, setMessage] = useState("");
  return <div className="panel padded narrow"><h2>Account settings</h2><p className="muted">Signed in as {current.email}</p><Field label="New password"><input type="password" value={password} onChange={e => setPassword(e.target.value)}/></Field><button className="primary" onClick={() => { if (password.length < 6) return setMessage("Use at least 6 characters."); onSave({ ...current, password }); setPassword(""); setMessage("Password updated."); }}>Change password</button>{message && <p className="success-text">{message}</p>}<p className="security-note">This classroom version stores account information in Local Storage. Do not use a real password.</p></div>;
}
function Notifications({ items }) { return <div className="panel padded">{items.length ? items.map(n => <div className="notification-row" key={n.id}><Bell size={18}/><div>{n.text}<small>{fmt(n.createdAt)}</small></div></div>) : <div className="empty-inline">You're all caught up. No notifications yet.</div>}</div>; }
function Messages({ current, users, messages, activeChat, setActiveChat, onSend }) {
  const [draft, setDraft] = useState(""); const selected = users.find(u => String(u.id) === String(activeChat));
  const thread = messages.filter(m => (String(m.senderId) === String(current.id) && String(m.receiverId) === String(activeChat)) || (String(m.senderId) === String(activeChat) && String(m.receiverId) === String(current.id)));
  return <div className="chat-panel panel"><aside className="chat-people"><h3>Conversations</h3>{users.map(u => <button className={String(activeChat) === String(u.id) ? "chat-person active" : "chat-person"} key={u.id} onClick={() => setActiveChat(u.id)}><img className="avatar small" src={u.photo || avatar(u.username)}/>{u.username}</button>)}</aside><section className="chat-window">{selected ? <><div className="chat-title">Chat with {selected.username}</div><div className="chat-messages">{thread.map(m => <div key={m.id} className={`bubble ${String(m.senderId) === String(current.id) ? "sent" : ""}`}>{m.text}<small>{fmt(m.createdAt)}</small></div>)}</div><form className="chat-compose" onSubmit={e => { e.preventDefault(); onSend(selected.id, draft); setDraft(""); }}><input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message..."/><button className="primary"><Send size={17}/></button></form></> : <div className="empty-inline">Select a user to start a conversation.</div>}</section></div>;
}
function AdminDashboard({ users, posts }) { return <><div className="stats-cards"><Stat icon={<Users/>} label="Registered users" value={users.length}/><Stat icon={<ImagePlus/>} label="Total posts" value={posts.length}/><Stat icon={<ShieldCheck/>} label="Admin module" value="Active"/></div><div className="panel padded"><h2>Admin overview</h2><p className="muted">Use the Admin Module to review registered accounts and moderate posts in this local demo.</p><div className="module-note"><ShieldCheck/> Admin access is separate from regular User accounts.</div></div></>; }
function Stat({ icon, label, value }) { return <div className="stat-card panel"><div className="stat-icon">{icon}</div><div><small>{label}</small><strong>{value}</strong></div></div>; }
function AdminUsers({ users, onDelete }) { return <div className="panel padded"><h2>Registered users</h2>{users.length ? <div className="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Joined</th><th>Followers</th><th>Action</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td><div className="table-user"><img className="avatar small" src={u.photo || avatar(u.username)}/><b>{u.username}</b></div></td><td>{u.email}</td><td>{fmt(u.createdAt)}</td><td>{u.followers?.length || 0}</td><td><button className="danger" onClick={() => { if (confirm(`Remove ${u.username}?`)) onDelete(u.id); }}><Trash2 size={15}/> Remove</button></td></tr>)}</tbody></table></div> : <p className="muted">No registered users yet.</p>}</div>; }
function AdminPosts({ posts, users, onDelete }) { return <div className="panel padded"><h2>Post moderation</h2>{posts.length ? <div className="admin-post-list">{posts.map(p => <div className="admin-post-row" key={p.id}><div><b>{users.find(u => String(u.id) === String(p.userId))?.username || "Unknown user"}</b><p>{p.text || (p.mediaType ? `[${p.mediaType} post]` : "Media post")}</p><small>{fmt(p.createdAt)}</small></div><button className="danger" onClick={() => { if (confirm("Delete this post?")) onDelete(p.id); }}><Trash2 size={15}/> Delete</button></div>)}</div> : <p className="muted">No posts to review.</p>}</div>; }
