/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Bell, MessageCircle, Search, Plus, Image, Video, Layers, MousePointer, Save,
  Smile, Send, X, Heart, MessageSquare, Share2, Bookmark,
  MoreHorizontal, Camera, Mic, Phone, VideoIcon, Info,
  ChevronRight, Play, Sparkles, Loader2, Upload, FileText,
  Music, Film, User, Users, Settings, LogOut, Globe,
  Lock, UserPlus, Zap, Hash, TrendingUp, RefreshCw, Key,
  ArrowLeft, Paperclip, ThumbsUp, Star, Edit3, Trash2,
  ChevronDown, Check, AlertCircle, Download, MapPin, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { User as UserType, Post, Comment, Story, Friend } from "@/src/types";
import { 
  generateCaption, 
  chatWithAI, 
  generateAIImage, 
  generateAIVideo 
} from "@/src/services/gemini";

/* ══════════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════════ */
const T = {
  bg:      "#0a0a12",
  card:    "#12121e",
  border:  "rgba(255,255,255,0.07)",
  cyan:    "#00c8ff",
  purple:  "#8b5cf6",
  blue:    "#3b82f6",
  green:   "#22c55e",
  pink:    "#ec4899",
  orange:  "#f97316",
  yellow:  "#eab308",
  text:    "rgba(255,255,255,0.9)",
  sub:     "rgba(255,255,255,0.45)",
  muted:   "rgba(255,255,255,0.2)",
};

const ts = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const AI_PERSONAS = {
  gemini: { name: "Gemini", icon: "✦", color: T.cyan,    model: "google" },
  grok:   { name: "Grok",   icon: "𝕏", color: T.orange,  model: "xai"    },
  gpt:    { name: "GPT-4",  icon: "⊕", color: T.green,   model: "openai" },
  claude: { name: "Claude", icon: "⚡", color: T.purple,  model: "anthropic" },
};

const ACCEPT_TYPES = ".mp3,.mp4,.jpg,.jpeg,.png,.psd,.txt,.pdf,.gif,.webp";

/* ══════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════ */
function fileIcon(type: string | undefined) {
  if (!type) return <FileText size={18} />;
  if (type.startsWith("image/"))  return <Image size={18} style={{color:T.cyan}} />;
  if (type.startsWith("video/"))  return <Film size={18} style={{color:T.purple}} />;
  if (type.startsWith("audio/"))  return <Music size={18} style={{color:T.pink}} />;
  if (type === "application/pdf") return <FileText size={18} style={{color:T.orange}} />;
  return <FileText size={18} style={{color:T.sub}} />;
}

function Avatar({ name, pic, size = 38, color = T.purple, online, className }: { name: string, pic?: string | null, size?: number, color?: string, online?: boolean, className?: string }) {
  const initials = name ? name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "?";
  return (
    <div className={className} style={{ position:"relative", display:"inline-block", flexShrink:0 }}>
      {pic ? (
        <img src={pic} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border:`2px solid ${color}44` }} referrerPolicy="no-referrer" />
      ) : (
        <div style={{
          width:size, height:size, borderRadius:"50%",
          background:`linear-gradient(135deg, ${color}cc, ${color}44)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:size*0.35, fontWeight:700, color:"white",
          border:`2px solid ${color}55`,
        }}>{initials}</div>
      )}
      {online && (
        <div style={{
          position:"absolute", bottom:1, right:1,
          width:10, height:10, borderRadius:"50%",
          background:T.green, border:"2px solid "+T.card,
        }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LOGIN SCREEN
══════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }: { onLogin: (u: UserType) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("Bellapiskota@gmail.com");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        // In a real app, we'd fetch the user data from the server here
        onLogin({
          name: "Bella Piskota",
          email: "bellapiskota@gmail.com",
          picture: null,
          coverPhoto: "https://picsum.photos/seed/netbook-cover/1200/400",
          bio: "Futuristka, milovnice AI a digitální umělkyně. Společně tvoříme budoucnost. 🚀",
          location: "Praha, Česká republika",
          sub: "google_" + Date.now(),
          provider: "google",
          stats: { posts: 12, friends: 142, followers: 89, following: 156, aiInteractions: 1240 }
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleGoogle = async () => {
    setLoading("google");
    setError("");
    try {
      const response = await fetch('/api/auth/url?provider=google');
      const { url } = await response.json();
      if (url) {
        window.open(url, 'oauth_popup', 'width=600,height=700');
      } else {
        setError("Google OAuth URL not found. Check VITE_GOOGLE_CLIENT_ID.");
        setLoading("");
      }
    } catch (err) {
      setError("Failed to initiate Google login.");
      setLoading("");
    }
  };

  const handleDemo = (asProvider = "demo") => {
    onLogin({
      name: tab === "register" && name.trim() ? name.trim() : "Bella Piskota",
      email: email.trim() || "bellapiskota@gmail.com",
      picture: null,
      coverPhoto: "https://picsum.photos/seed/netbook-cover/1200/400",
      bio: "Futuristka, milovnice AI a digitální umělkyně. Společně tvoříme budoucnost. 🚀",
      location: "Praha, Česká republika",
      sub: "demo_" + Date.now(),
      provider: asProvider,
      stats: { posts: 12, friends: 142, followers: 89, following: 156, aiInteractions: 1240 }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{
      background: `radial-gradient(ellipse at 20% 20%, ${T.purple}22 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${T.cyan}18 0%, transparent 50%), ${T.bg}`,
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${T.purple}, ${T.cyan})` }}>
            <span className="text-3xl font-black text-white">N</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">NetBook</h1>
          <p className="text-sm text-white/40 mt-1">Sociální síť s AI · Připoj se ke komunitě</p>
        </div>

        <div className="bg-[#12121e] rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => setTab(m as any)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === m ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
              >
                {m === "login" ? "Přihlásit se" : "Registrovat"}
              </button>
            ))}
          </div>

          {tab === "register" && (
            <div className="mb-4">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tvoje celé jméno"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
          )}

          <div className="mb-6">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoogle}
              disabled={!!loading}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-white font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {loading === "google" ? <Loader2 className="animate-spin" size={18} /> : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google
            </button>

            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">nebo</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={() => handleDemo()}
              className="w-full py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold hover:bg-cyan-500/20 transition-all"
            >
              Demo mód — bez přihlášení
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CREATE POST MODAL
══════════════════════════════════════════════════════════ */
function CreatePostModal({ user, onClose, onPost }: { user: UserType, onClose: () => void, onPost: (p: Post) => void }) {
  const [text, setText] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [highQuality, setHighQuality] = useState(false);
  const [aiCaptionLoading, setAiCaptionLoading] = useState(false);
  const [postType, setPostType] = useState<"post" | "reel" | "story">("post");
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          setImgUrl(data.url);
          setVideoUrl(null);
        }
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          setVideoUrl(data.url);
          setImgUrl(null);
          setPostType("reel");
        }
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) return;
    setGenLoading(true);
    try {
      const url = await generateAIImage(aiPrompt);
      if (url) setImgUrl(url);
    } catch (err) {
      console.error(err);
    }
    setGenLoading(false);
  };

  const handleGenerateVideo = async () => {
    if (!aiPrompt.trim()) return;
    setGenLoading(true);
    try {
      const url = await generateAIVideo(aiPrompt, highQuality);
      if (url) {
        setVideoUrl(url);
        setPostType("reel");
      }
    } catch (err) {
      console.error(err);
    }
    setGenLoading(false);
  };

  const handleGenerateCaption = async () => {
    setAiCaptionLoading(true);
    try {
      const ctx = text || aiPrompt || "nový příspěvek na sociální síti";
      const res = await generateCaption(ctx);
      if (res) setText(res);
    } catch {}
    setAiCaptionLoading(false);
  };

  const [isRecording, setIsRecording] = useState(false);
  const [vocalImprint, setVocalImprint] = useState<string | null>(null);

  const handleRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setVocalImprint("BTS_SIG_" + Math.random().toString(36).substring(7).toUpperCase() + "_VERIFIED");
    }, 3000);
  };

  const handlePost = () => {
    if (!text.trim() && !imgUrl && !videoUrl && !vocalImprint) return;
    onPost({
      id: Date.now(),
      authorId: user.sub,
      authorName: user.name,
      authorPic: user.picture,
      content: text,
      image: imgUrl,
      video: videoUrl,
      type: postType,
      likes: 0,
      comments: [],
      shares: 0,
      saved: false,
      liked: false,
      time: "právě teď",
      privacy,
      vocalImprint,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-xl bg-[#12121e] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden h-[90vh] sm:h-auto max-h-[90vh] flex flex-col"
      >
        <div className="p-5 border-bottom border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Vytvořit obsah</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          <div className="flex gap-2">
            {(["post", "reel", "story"] as const).map(type => (
              <button
                key={type}
                onClick={() => setPostType(type)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${postType === type ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                {type === "post" ? "📝 Příspěvek" : type === "reel" ? "🎬 Reel" : "📖 Story"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Avatar name={user.name} pic={user.picture} size={44} />
            <div>
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="flex gap-1 mt-1">
                {(["public", "friends", "private"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPrivacy(p)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${privacy === p ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-white/30'}`}
                  >
                    {p === "public" ? "🌍 Veřejný" : p === "friends" ? "👥 Přátelé" : "🔒 Soukromý"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Co máš na mysli?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm min-h-[120px] outline-none focus:border-purple-500/30 transition-all resize-none"
            />
            <button
              onClick={handleGenerateCaption}
              disabled={aiCaptionLoading}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold flex items-center gap-2 hover:bg-purple-500/20 transition-all"
            >
              {aiCaptionLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI Popisek
            </button>
          </div>

          {(imgUrl || videoUrl) && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
              {imgUrl && <img src={imgUrl} className="w-full max-h-[300px] object-cover" alt="AI Generated" />}
              {videoUrl && <video src={videoUrl} className="w-full max-h-[300px] object-cover" controls autoPlay loop />}
              <button 
                onClick={() => { setImgUrl(null); setVideoUrl(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />} 
              Nahrát fotku
            </button>
            <button 
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />} 
              Nahrát video
            </button>
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Mic size={12} /> Vocal Imprint (Biometrický podpis)
              </div>
              {vocalImprint && (
                <span className="text-[9px] text-green-400 font-bold flex items-center gap-1">
                  <Check size={10} /> Ověřeno
                </span>
              )}
            </div>
            <button
              onClick={handleRecord}
              disabled={isRecording}
              className={`w-full py-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${isRecording ? 'bg-red-500/10 border-red-500/50 text-red-400' : vocalImprint ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
            >
              {isRecording ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Nahrávám otisk...
                </>
              ) : vocalImprint ? (
                <>
                  <RefreshCw size={16} /> Přeměřit otisk
                </>
              ) : (
                <>
                  <Mic size={16} /> Nahrát 15s hlasový otisk
                </>
              )}
            </button>
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} /> Generovat AI Obsah
              </div>
              <button 
                onClick={() => setHighQuality(!highQuality)}
                className={`text-[9px] font-bold px-2 py-1 rounded-md border transition-all ${highQuality ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-white/20'}`}
              >
                {highQuality ? "✨ High Quality On" : "Standard Quality"}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Popiš, co chceš vytvořit..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-purple-500/30"
              />
              <button
                onClick={handleGenerateImage}
                disabled={genLoading || !aiPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-2 hover:bg-purple-500/20 disabled:opacity-50"
              >
                {genLoading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
                Obrázek
              </button>
              <button
                onClick={handleGenerateVideo}
                disabled={genLoading || !aiPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-2 hover:bg-cyan-500/20 disabled:opacity-50"
              >
                {genLoading ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                Video
              </button>
            </div>
          </div>

          <button
            onClick={handlePost}
            disabled={!text.trim() && !imgUrl && !videoUrl}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold text-sm shadow-xl hover:shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            Zveřejnit
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   POST CARD
══════════════════════════════════════════════════════════ */
function PostCard({ post, currentUser, onUpdate }: { post: Post, currentUser: UserType, onUpdate: (p: Post) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const toggleLike = () => onUpdate({ ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 });
  const toggleSave = () => onUpdate({ ...post, saved: !post.saved });

  useEffect(() => {
    if (showComments && post.id) {
      fetch(`/api/posts/${post.id}/comments`)
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            onUpdate({
              ...post,
              comments: data.map((c: any) => ({
                id: c.id,
                author: c.author_name,
                text: c.text,
                time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }))
            });
          }
        });
    }
  }, [showComments, post.id]);

  const addComment = async () => {
    if (!commentText.trim()) return;
    const c: Comment = { id: Date.now(), author: currentUser.name, text: commentText, time: ts() };
    onUpdate({ ...post, comments: [...post.comments, c] });
    setCommentText("");
    
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: c.id,
          postId: post.id,
          authorName: c.author,
          text: c.text
        })
      });
    } catch (err) {
      console.error("Failed to save comment", err);
    }
  };

  const isLong = post.content.length > 200;
  const displayText = isLong && !expanded ? post.content.slice(0, 200) + "..." : post.content;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#12121e] rounded-3xl border border-white/10 overflow-hidden mb-4"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={post.authorName} pic={post.authorPic} size={42} online={post.authorId === "u2"} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{post.authorName}</span>
              {post.type !== "post" && (
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 uppercase font-bold tracking-widest">
                  {post.type}
                </span>
              )}
            </div>
            <div className="text-[10px] text-white/30 flex items-center gap-2">
              {post.time} · {{ public: "🌍", friends: "👥", private: "🔒" }[post.privacy]}
            </div>
          </div>
        </div>
        <button className="text-white/20 hover:text-white/40"><MoreHorizontal size={18} /></button>
      </div>

      {post.content && (
        <div className="px-4 pb-3 text-sm text-white/80 leading-relaxed">
          <Markdown>{displayText}</Markdown>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} className="text-cyan-400 font-bold text-xs ml-1">
              {expanded ? "méně" : "více"}
            </button>
          )}
        </div>
      )}

      {post.vocalImprint && (
        <div className="px-4 py-2 bg-purple-500/5 border-y border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Mic size={14} />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Vocal Imprint Signature</div>
            <div className="text-[9px] text-white/40 font-mono truncate">{post.vocalImprint}</div>
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <motion.div 
                key={i}
                animate={{ height: [4, 12, 4] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                className="w-0.5 bg-purple-500/50 rounded-full"
              />
            ))}
          </div>
        </div>
      )}

      {post.image && (
        <div className="relative aspect-video overflow-hidden border-y border-white/5">
          <img src={post.image} className="w-full h-full object-cover" alt="Post content" referrerPolicy="no-referrer" />
        </div>
      )}

      {post.video && (
        <div className="relative aspect-video overflow-hidden border-y border-white/5 bg-black">
          <video src={post.video} className="w-full h-full object-contain" controls autoPlay muted loop />
        </div>
      )}

      <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={toggleLike} className={`flex items-center gap-2 text-xs font-bold transition-all ${post.liked ? 'text-pink-500' : 'text-white/30 hover:text-white/50'}`}>
            <Heart size={18} fill={post.liked ? "currentColor" : "none"} /> {post.likes}
          </button>
          <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 text-xs font-bold transition-all ${showComments ? 'text-cyan-400' : 'text-white/30 hover:text-white/50'}`}>
            <MessageSquare size={18} /> {post.comments.length}
          </button>
          <button className="flex items-center gap-2 text-xs font-bold text-white/30 hover:text-white/50">
            <Share2 size={18} /> {post.shares}
          </button>
        </div>
        <button onClick={toggleSave} className={`${post.saved ? 'text-yellow-400' : 'text-white/30 hover:text-white/50'}`}>
          <Bookmark size={18} fill={post.saved ? "currentColor" : "none"} />
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 bg-white/[0.02]"
          >
            <div className="p-4 flex flex-col gap-4">
              {post.comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.author} size={30} color={T.cyan} />
                  <div className="flex-1 bg-white/5 rounded-2xl p-3">
                    <div className="text-xs font-bold text-white mb-1">{c.author}</div>
                    <div className="text-xs text-white/70">{c.text}</div>
                    <div className="text-[8px] text-white/20 mt-2">{c.time}</div>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 mt-2">
                <Avatar name={currentUser.name} pic={currentUser.picture} size={30} />
                <div className="flex-1 flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Napiš komentář..."
                    onKeyDown={e => e.key === "Enter" && addComment()}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/30"
                  />
                  <button 
                    onClick={addComment}
                    disabled={!commentText.trim()}
                    className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MESSENGER PANEL
══════════════════════════════════════════════════════════ */
function Messenger({ user, friends, onClose }: { user: UserType, friends: Friend[], onClose: () => void }) {
  const [active, setActive] = useState(friends[0]);
  const [convos, setConvos] = useState<Record<string, any[]>>({});
  const [msg, setMsg] = useState("");
  const [aiMode, setAiMode] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convos, active]);

  const msgs = convos[active?.id] || [];

  const send = async () => {
    if (!msg.trim()) return;
    const m = { id: Date.now(), from: "me", text: msg, time: ts() };
    const newMsgs = [...msgs, m];
    setConvos(p => ({ ...p, [active.id]: newMsgs }));
    const sentMsg = msg;
    setMsg("");

    if (aiMode) {
      setAiBusy(true);
      try {
        const history = newMsgs.slice(-6).map(m => ({ role: m.from === "me" ? "user" : "assistant", content: m.text }));
        const reply = await chatWithAI(history, aiMode);
        setConvos(p => ({ ...p, [active.id]: [...(p[active.id] || []), { id: Date.now() + 1, from: "ai", text: reply, time: ts(), persona: aiMode }] }));
      } catch (e) {
        setConvos(p => ({ ...p, [active.id]: [...(p[active.id] || []), { id: Date.now() + 1, from: "ai", text: "⚠️ AI nedostupné", time: ts(), persona: aiMode }] }));
      }
      setAiBusy(false);
    } else {
      setTimeout(() => {
        const replies = ["👍", "Paráda!", "Jasně, domluveno", "Dám vědět 🔥", "Super nápad!", "Mrknu na to", "😂 to jo!"];
        setConvos(p => ({ ...p, [active.id]: [...(p[active.id] || []), { id: Date.now() + 1, from: active.id, text: rand(replies), time: ts() }] }));
      }, 1000);
    }
  };

  const persona = aiMode ? (AI_PERSONAS as any)[aiMode] : null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-0 sm:inset-auto sm:bottom-0 sm:right-4 w-full sm:w-[360px] h-[100dvh] sm:h-[540px] bg-[#12121e] sm:border border-white/10 sm:rounded-t-3xl shadow-2xl z-[100] flex flex-col"
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#12121e]/80 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {friends.slice(0, 5).map(f => (
            <button 
              key={f.id} 
              onClick={() => setActive(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 transition-all border ${active.id === f.id ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-white/30'}`}
            >
              <Avatar name={f.name} size={18} color={f.color} online={f.status === "online"} />
              {f.name.split(" ")[0]}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white/40 ml-2"><X size={18} /></button>
      </div>

      <div className="p-2 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest ml-2">AI:</span>
        {Object.entries(AI_PERSONAS).map(([k, v]) => (
          <button 
            key={k} 
            onClick={() => setAiMode(aiMode === k ? null : k)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-bold flex items-center gap-1.5 transition-all border ${aiMode === k ? `bg-${v.color}/10 border-${v.color}/50 text-${v.color}` : 'bg-white/5 border-white/10 text-white/30'}`}
            style={{ 
              borderColor: aiMode === k ? v.color + "50" : undefined,
              backgroundColor: aiMode === k ? v.color + "10" : undefined,
              color: aiMode === k ? v.color : undefined
            }}
          >
            {v.icon} {v.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
        {msgs.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
            <MessageCircle size={48} className="mb-4" />
            <p className="text-sm">Začni chatovat s {aiMode ? persona?.name : active.name}</p>
          </div>
        )}
        {msgs.map(m => {
          const isMe = m.from === "me";
          const isAI = m.from === "ai";
          const p = isAI ? (AI_PERSONAS as any)[m.persona] : null;
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
              {!isMe && <Avatar name={isAI ? p?.name : active.name} size={28} color={isAI ? p?.color : active.color} />}
              <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-purple-500/20 border border-purple-500/30 text-white rounded-br-none' : isAI ? 'bg-cyan-500/10 border border-cyan-500/20 text-white rounded-bl-none' : 'bg-white/5 border border-white/10 text-white/80 rounded-bl-none'}`}>
                {isAI && <div className="text-[8px] font-bold mb-1 opacity-50 flex items-center gap-1">{p?.icon} {p?.name}</div>}
                <Markdown>{m.text}</Markdown>
                <div className="text-[8px] opacity-30 mt-1 text-right">{m.time}</div>
              </div>
            </div>
          );
        })}
        {aiBusy && (
          <div className="flex gap-2 items-end">
            <Avatar name={persona?.name} size={28} color={persona?.color} />
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-white/10 flex gap-2">
        <input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={aiMode ? `Zeptej se ${persona?.name}...` : "Napiš zprávu..."}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white outline-none focus:border-purple-500/30"
        />
        <button 
          onClick={send}
          disabled={!msg.trim()}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white flex items-center justify-center shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   AI SIDEBAR
══════════════════════════════════════════════════════════ */
function AISidebar() {
  const [persona, setPersona] = useState<"gemini" | "grok" | "gpt" | "claude">("gemini");
  const [msgs, setMsgs] = useState<any[]>([{ role: "assistant", content: `Ahoj! Jsem ${AI_PERSONAS.gemini.name}. Jak ti mohu pomoci s tvorbou obsahu? ✨`, id: 1 }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const userMsg = { role: "user", content: input, id: Date.now() };
    const hist = [...msgs, userMsg];
    setMsgs(hist);
    setInput("");
    setBusy(true);
    try {
      const reply = await chatWithAI(hist.map(m => ({ role: m.role, content: m.content })), persona);
      setMsgs(p => [...p, { role: "assistant", content: reply, id: Date.now() + 1 }]);
    } catch (e) {
      setMsgs(p => [...p, { role: "assistant", content: `⚠️ Chyba AI`, id: Date.now() + 1 }]);
    }
    setBusy(false);
  };

  const p = AI_PERSONAS[persona];

  return (
    <div className="bg-[#12121e] rounded-3xl border border-white/10 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="text-xs font-bold text-white flex items-center gap-2">
          <span style={{ color: p.color }}>{p.icon}</span> AI Asistent
        </div>
        <div className="flex gap-1">
          {Object.entries(AI_PERSONAS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setPersona(k as any)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-all border ${persona === k ? 'border-white/50 bg-white/10' : 'border-white/5 hover:bg-white/5'}`}
              style={{ color: v.color }}
            >
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
        {msgs.map(m => (
          <div key={m.id} className={`flex flex-col ${m.role === "user" ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-2xl text-[11px] leading-relaxed ${m.role === "user" ? 'bg-purple-500/20 border border-purple-500/30 text-white rounded-br-none' : 'bg-white/5 border border-white/10 text-white/80 rounded-bl-none'}`}>
              <Markdown>{m.content}</Markdown>
            </div>
          </div>
        ))}
        {busy && (
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1 w-fit">
            <div className="w-1 h-1 rounded-full bg-white/20 animate-bounce" />
            <div className="w-1 h-1 rounded-full bg-white/20 animate-bounce [animation-delay:0.2s]" />
            <div className="w-1 h-1 rounded-full bg-white/20 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={`Zeptej se ${p.name}...`}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[10px] text-white outline-none focus:border-purple-500/30"
        />
        <button 
          onClick={send}
          disabled={!input.trim() || busy}
          className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   IMAGE STUDIO (CANVAS ENGINE)
══════════════════════════════════════════════════════════ */
function ImageStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [tool, setTool] = useState<"brush" | "select" | "erase">("brush");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const url = await generateAIImage(prompt);
      if (url) {
        setImg(url);
        const image = new window.Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        image.onload = () => {
          const ctx = canvasRef.current?.getContext("2d");
          if (ctx) ctx.drawImage(image, 0, 0, 800, 800);
        };
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (800 / rect.width);
    const y = (e.clientY - rect.top) * (800 / rect.height);

    if (tool === "brush") {
      ctx.fillStyle = "rgba(0, 200, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === "erase") {
      ctx.clearRect(x - 15, y - 15, 30, 30);
    }
  };

  return (
    <div className="bg-[#12121e] rounded-3xl border border-white/10 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <Sparkles className="text-cyan-400" /> AI Studio & Retuš
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setTool("brush")} className={`p-2 rounded-xl border transition-all ${tool === "brush" ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
            <MousePointer size={18} />
          </button>
          <button onClick={() => setTool("erase")} className={`p-2 rounded-xl border transition-all ${tool === "erase" ? 'bg-pink-500/10 border-pink-500/50 text-pink-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
            <RefreshCw size={18} />
          </button>
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white">
            <Save size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <input 
          placeholder="Popiš vizuál pro generování..." 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)} 
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-cyan-500/30 transition-all"
        />
        <button 
          onClick={generateImage} 
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Generovat"}
        </button>
      </div>

      <div className="relative aspect-square w-full max-w-[600px] mx-auto bg-black rounded-2xl overflow-hidden border border-white/10 cursor-crosshair">
        <canvas 
          ref={canvasRef} 
          width={800} height={800} 
          onMouseMove={(e) => e.buttons === 1 && handleCanvasClick(e)}
          onMouseDown={handleCanvasClick}
          className="w-full h-full object-contain"
        />
        {!img && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 opacity-20">
            <Image size={64} className="mb-4" />
            <p className="text-sm">Zadej prompt a vygeneruj základ pro retuš</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUNO MUSIC INTERFACE
══════════════════════════════════════════════════════════ */
function SunoInterface() {
  const [lyrics, setLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMusic = async () => {
    if (!lyrics.trim()) return;
    setIsGenerating(true);
    // Simulated Suno Bridge
    setTimeout(() => setIsGenerating(false), 4000);
  };

  return (
    <div className="bg-[#12121e] rounded-3xl border border-white/10 p-6 flex flex-col gap-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-3">
        <Music className="text-pink-400" /> Suno AI Music Generator
      </h3>
      
      <div className="flex flex-col gap-4">
        <textarea 
          placeholder="Vlož text písně nebo popis žánru (např. Trap beat with deep bass, futuristic atmosphere...)" 
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm min-h-[150px] outline-none focus:border-pink-500/30 transition-all resize-none"
        />
        <button 
          onClick={generateMusic} 
          disabled={isGenerating || !lyrics.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-xl hover:shadow-pink-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Komponuji skladbu...
            </>
          ) : (
            <>
              <Zap size={18} /> Vytvořit track
            </>
          )}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Poslední generace</p>
        <div className="flex flex-col gap-2">
          {[
            { name: "BTS_Vocal_Imprint_V1.mp3", duration: "0:45", date: "Dnes" },
            { name: "Cyberpunk_Dreams_Loop.mp3", duration: "1:20", date: "Včera" },
          ].map((track, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                  <Play size={18} fill="currentColor" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{track.name}</div>
                  <div className="text-[10px] text-white/30">{track.duration} · {track.date}</div>
                </div>
              </div>
              <button className="text-white/20 hover:text-white"><MoreHorizontal size={18} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ACCOUNT SETTINGS
══════════════════════════════════════════════════════════ */
function AccountSettings({ user }: { user: UserType }) {
  const [activeSection, setActiveSection] = useState("Soukromí");
  const sections = [
    { id: "Soukromí", icon: Lock },
    { id: "Zabezpečení", icon: Lock },
    { id: "Platby (Wolt)", icon: Zap },
    { id: "AI Autonomie", icon: Sparkles },
    { id: "Vokální Stopa", icon: Mic },
    { id: "Metaverse", icon: Globe },
  ];

  return (
    <div className="bg-[#12121e] rounded-3xl border border-white/10 overflow-hidden min-h-[600px] flex flex-col lg:flex-row">
      <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 p-4 flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar">
        <h2 className="hidden lg:block px-4 py-2 text-xs font-bold text-white/20 uppercase tracking-widest mb-2">Nastavení</h2>
        {sections.map(({ id, icon: Icon }) => (
          <button 
            key={id} 
            onClick={() => setActiveSection(id)}
            className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeSection === id ? 'bg-purple-500/10 text-purple-400' : 'text-white/30 hover:bg-white/5 hover:text-white/50'}`}
          >
            <Icon size={18} /> <span className="whitespace-nowrap">{id}</span>
          </button>
        ))}
      </div>
      
      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-xl">
          <h3 className="text-xl font-bold text-white mb-6">{activeSection}</h3>
          
          {activeSection === "Soukromí" && (
            <div className="flex flex-col gap-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-white">Profil Architekta</div>
                    <div className="text-xs text-white/40">Kdo může vidět tvůj profil a statistiky</div>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 relative">
                    <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-purple-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <Avatar name={user.name} pic={user.picture} size={64} />
                  <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all">
                    Změnit fotku
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-white/40 ml-2">Jméno v síti</label>
                <input defaultValue={user.name} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-purple-500/30" />
              </div>
            </div>
          )}

          {activeSection === "AI Autonomie" && (
            <div className="flex flex-col gap-8">
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-3xl p-8 border border-white/10">
                <div className="text-sm font-bold text-white mb-2">BTS Autonomy Level</div>
                <p className="text-xs text-white/40 mb-6">Nastav úroveň nezávislosti tvých AI asistentů při generování obsahu.</p>
                <input type="range" className="w-full accent-purple-500" />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <span>Nástroj</span>
                  <span>Partner</span>
                  <span>Autonomní</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Etický filtr", active: true },
                  { label: "Auto-moderace", active: false },
                  { label: "AI Odpovědi", active: true },
                  { label: "Deep Analysis", active: true },
                ].map(item => (
                  <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    <div className={`w-8 h-4 rounded-full relative ${item.active ? 'bg-cyan-500/20 border border-cyan-500/50' : 'bg-white/5 border border-white/10'}`}>
                      <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full ${item.active ? 'right-0.5 bg-cyan-400' : 'left-0.5 bg-white/20'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection !== "Soukromí" && activeSection !== "AI Autonomie" && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
              <Settings size={48} className="mb-4" />
              <p className="text-sm">Sekce {activeSection} je v přípravě</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROFILE VIEW
══════════════════════════════════════════════════════════ */
function ProfileView({ user, posts, onUpdatePost }: { user: UserType, posts: Post[], onUpdatePost: (p: Post) => void }) {
  const userPosts = posts.filter(p => p.authorId === user.sub);
  
  return (
    <div className="flex flex-col gap-6">
      {/* Cover & Profile Header */}
      <div className="bg-[#12121e] rounded-3xl border border-white/10 overflow-hidden">
        <div className="h-48 relative group">
          <img 
            src={user.coverPhoto || "https://picsum.photos/seed/netbook-cover/1200/400"} 
            className="w-full h-full object-cover" 
            alt="Cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all" />
          <button className="absolute bottom-4 right-4 p-2 rounded-xl bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all flex items-center gap-2 text-xs font-bold">
            <Camera size={14} /> Upravit titulní fotku
          </button>
        </div>
        
        <div className="px-4 sm:px-8 pb-8 relative">
          <div className="absolute -top-12 sm:-top-16 left-4 sm:left-8">
            <div className="relative group">
              <Avatar name={user.name} pic={user.picture} size={80} color={T.purple} className="sm:hidden" />
              <div className="hidden sm:block">
                <Avatar name={user.name} pic={user.picture} size={120} color={T.purple} />
              </div>
              <button className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white">
                <Camera size={24} />
              </button>
            </div>
          </div>
          
          <div className="pt-12 sm:pt-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{user.name}</h2>
              <p className="text-white/40 text-sm mt-1">{user.email}</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-white/60 text-xs">
                  <MapPin size={14} className="text-purple-400" /> {user.location || "Nezadáno"}
                </div>
                <div className="flex items-center gap-2 text-white/60 text-xs">
                  <Calendar size={14} className="text-cyan-400" /> Připojen(a) březen 2024
                </div>
                <div className="flex items-center gap-2 text-white/60 text-xs">
                  <Globe size={14} className="text-green-400" /> netbook.social/{user.name.toLowerCase().replace(/\s+/g, '')}
                </div>
              </div>
              
              <p className="mt-6 text-sm text-white/80 max-w-2xl leading-relaxed">
                {user.bio || "Zatím žádné bio. Řekni světu něco o sobě!"}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2">
                <Edit3 size={16} /> Upravit profil
              </button>
              <button className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
                <Share2 size={16} /> Sdílet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Příspěvky", value: user.stats?.posts || 0, icon: FileText, color: T.purple },
          { label: "Přátelé", value: user.stats?.friends || 0, icon: Users, color: T.blue },
          { label: "Sledovatelé", value: user.stats?.followers || 0, icon: Heart, color: T.pink },
          { label: "Sleduji", value: user.stats?.following || 0, icon: UserPlus, color: T.orange },
          { label: "AI Interakce", value: user.stats?.aiInteractions || 0, icon: Zap, color: T.cyan },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#12121e] rounded-3xl border border-white/10 p-5 flex flex-col items-center text-center group hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-2xl mb-3 flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: stat.color + "15", color: stat.color }}>
              <stat.icon size={20} />
            </div>
            <div className="text-xl font-black text-white">{stat.value.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Content Tabs */}
      <div className="flex gap-8 border-b border-white/5 px-4">
        {["Příspěvky", "Reels", "Média", "Uložené"].map((tab, i) => (
          <button 
            key={tab} 
            className={`pb-4 text-sm font-bold transition-all relative ${i === 0 ? 'text-purple-400' : 'text-white/40 hover:text-white/60'}`}
          >
            {tab}
            {i === 0 && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
          </button>
        ))}
      </div>

      {/* User Posts */}
      <div className="flex flex-col gap-4">
        {userPosts.length > 0 ? (
          userPosts.map(p => <PostCard key={p.id} post={p} currentUser={user} onUpdate={onUpdatePost} />)
        ) : (
          <div className="bg-[#12121e] rounded-3xl border border-white/10 p-12 text-center opacity-30">
            <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <Plus size={32} />
            </div>
            <p className="text-sm font-bold">Zatím jsi nic nezveřejnil(a)</p>
            <button className="mt-4 text-purple-400 text-xs font-bold hover:underline">Vytvořit první příspěvek</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("feed");
  const [showSearch, setShowSearch] = useState(false);
  const [notifs, setNotifs] = useState(3);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setPosts(data.map((p: any) => ({
            ...p,
            comments: [], // Comments would be fetched separately in a real app
            liked: false,
            saved: false,
            authorName: "Maya Kovář", // Mocking author name for now
            authorPic: null,
            time: "před chvílí"
          })));
        }
      });
  }, []);

  const handleLogin = async (u: UserType) => {
    setUser(u);
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: u.sub,
          name: u.name,
          email: u.email,
          picture: u.picture,
          provider: u.provider
        })
      });
    } catch (err) {
      console.error("Failed to save user", err);
    }
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const addPost = async (p: Post) => {
    setPosts(prev => [p, ...prev]);
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
    } catch (err) {
      console.error("Failed to save post", err);
    }
  };

  const updatePost = (p: Post) => setPosts(prev => prev.map(x => x.id === p.id ? p : x));

  const filteredPosts = search
    ? posts.filter(p => p.content.toLowerCase().includes(search.toLowerCase()) || p.authorName.toLowerCase().includes(search.toLowerCase()))
    : posts;

  const navItems = [
    { id: "feed", icon: Home, label: "Feed" },
    { id: "reels", icon: Film, label: "Reels" },
    { id: "friends", icon: Users, label: "Přátelé" },
    { id: "explore", icon: TrendingUp, label: "Explore" },
    { id: "studio", icon: Layers, label: "Studio" },
    { id: "music", icon: Music, label: "Music" },
    { id: "profile", icon: User, label: "Profil" },
    { id: "settings", icon: Settings, label: "Nastavení" },
  ];

  const DEMO_FRIENDS: Friend[] = [
    { id: "u2", name: "Maya Kovář", status: "online", color: T.purple },
    { id: "u3", name: "Tomáš Novák", status: "online", color: T.blue },
    { id: "u4", name: "Sofia Blanche", status: "před 10 min", color: T.pink },
    { id: "u5", name: "Radek Havel", status: "online", color: T.orange },
    { id: "u6", name: "Lucie Malá", status: "před 1 hod", color: T.green },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white/90 font-sans selection:bg-purple-500/30">
      
      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a12]/80 backdrop-blur-2xl border-b border-white/5 px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-lg font-black text-white">N</span>
          </div>
          <span className="text-xl font-black tracking-tighter hidden sm:block">NetBook</span>
        </div>

        <div className="hidden md:flex flex-1 max-w-md bg-white/5 border border-white/10 rounded-full px-4 py-2 items-center gap-3 group focus-within:border-purple-500/30 transition-all">
          <Search size={16} className="text-white/20 group-focus-within:text-purple-400 transition-colors" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Hledat na NetBook..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <Search size={18} />
          </button>

          <button 
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 sm:w-auto sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center sm:justify-start gap-2 shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Přidat</span>
          </button>

          <button className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white/40 hover:text-white relative transition-all">
            <Bell size={18} />
            {notifs > 0 && <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pink-500 text-[8px] font-black flex items-center justify-center text-white">{notifs}</span>}
          </button>

          <button 
            onClick={() => setShowMsg(!showMsg)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${showMsg ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
          >
            <MessageCircle size={18} />
          </button>

          <div className="ml-1 sm:ml-2 cursor-pointer" onClick={() => setActiveTab("profile")}>
            <Avatar name={user.name} pic={user.picture} size={36} online />
          </div>
        </div>
      </nav>

      {/* ── MOBILE SEARCH OVERLAY ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="md:hidden fixed top-16 left-0 right-0 z-[45] bg-[#0a0a12]/95 backdrop-blur-xl border-b border-white/10 p-4"
          >
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-3 flex items-center gap-3 focus-within:border-purple-500/30 transition-all">
              <Search size={18} className="text-white/20" />
              <input 
                autoFocus
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Hledat na NetBook..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20"
              />
              <button onClick={() => setShowSearch(false)} className="text-white/40"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN LAYOUT ── */}
      <main className="max-w-7xl mx-auto p-2 sm:p-4 grid grid-cols-1 md:grid-cols-[1fr_300px] lg:grid-cols-[260px_1fr_300px] gap-4 sm:gap-6 pb-24 sm:pb-4">
        
        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-20 h-fit">
          <div className="bg-[#12121e] rounded-3xl border border-white/10 p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={user.name} pic={user.picture} size={56} online />
              <div>
                <h3 className="font-bold text-white text-sm">{user.name}</h3>
                <p className="text-[10px] text-white/30 truncate max-w-[140px]">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-bold uppercase tracking-widest">
                  {user.provider}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
              {[["Příspěvky", posts.length], ["Přátelé", 142], ["Sledovatelé", 89]].map(([l, n]) => (
                <div key={l as string} className="text-center">
                  <div className="text-sm font-bold text-white">{n}</div>
                  <div className="text-[8px] text-white/30 uppercase font-bold tracking-tighter">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <nav className="bg-[#12121e] rounded-3xl border border-white/10 p-2">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button 
                key={id} 
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === id ? 'bg-purple-500/10 text-purple-400' : 'text-white/30 hover:bg-white/5 hover:text-white/50'}`}
              >
                <Icon size={20} /> {label}
              </button>
            ))}
            <div className="h-px bg-white/5 my-2 mx-4" />
            <button 
              onClick={() => setUser(null)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-red-400/60 hover:bg-red-500/5 hover:text-red-400 transition-all"
            >
              <LogOut size={20} /> Odhlásit se
            </button>
          </nav>
        </aside>

        {/* ── FEED / PROFILE / STUDIO / MUSIC / SETTINGS ── */}
        <section className="flex flex-col gap-4">
          {activeTab === "profile" ? (
            <ProfileView user={user} posts={posts} onUpdatePost={updatePost} />
          ) : activeTab === "studio" ? (
            <ImageStudio />
          ) : activeTab === "music" ? (
            <SunoInterface />
          ) : activeTab === "settings" ? (
            <AccountSettings user={user} />
          ) : (
            <>
              {/* ── STORIES ── */}
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex-shrink-0 w-28 h-44 rounded-2xl border border-white/10 bg-white/5 relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                  <Avatar name={user.name} pic={user.picture} size={32} className="absolute top-3 left-3 z-10 border-2 border-purple-500" />
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <div className="text-[10px] font-bold text-white truncate">{user.name}</div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <Plus size={24} className="text-white" />
                  </div>
                </div>
                {DEMO_FRIENDS.map(f => (
                  <div key={f.id} className="flex-shrink-0 w-28 h-44 rounded-2xl border border-white/10 relative overflow-hidden cursor-pointer group">
                    <img src={`https://picsum.photos/seed/${f.id}/200/300`} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                    <div className="absolute top-3 left-3 z-10">
                      <Avatar name={f.name} size={32} color={f.color} online={f.status === "online"} />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 z-10">
                      <div className="text-[10px] font-bold text-white truncate">{f.name}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#12121e] rounded-3xl border border-white/10 p-4">
                <div className="flex items-center gap-4">
                  <Avatar name={user.name} pic={user.picture} size={44} />
                  <button 
                    onClick={() => setShowCreate(true)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-left text-white/30 text-sm hover:bg-white/10 transition-all"
                  >
                    Co máš na mysli, {user.name.split(" ")[0]}?
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/5">
                  {[
                    { icon: Video, label: "Video", color: "text-purple-400" },
                    { icon: Image, label: "Fotka", color: "text-green-400" },
                    { icon: Sparkles, label: "AI", color: "text-cyan-400" },
                    { icon: Film, label: "Reel", color: "text-pink-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <button key={label} onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/5 transition-all">
                      <Icon size={16} className={color} />
                      <span className="text-[10px] font-bold text-white/40">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {filteredPosts.map(p => (
                  <PostCard key={p.id} post={p} currentUser={user} onUpdate={updatePost} />
                ))}
                {filteredPosts.length === 0 && (
                  <div className="text-center py-20 opacity-20">
                    <Search size={48} className="mx-auto mb-4" />
                    <p>Žádné příspěvky k zobrazení</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="hidden md:flex flex-col gap-4 sticky top-20 h-[calc(100vh-100px)]">
          <div className="bg-[#12121e] rounded-3xl border border-white/10 p-6 hidden lg:block">
            <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4 flex items-center justify-between">
              Trending <TrendingUp size={12} />
            </h4>
            <div className="flex flex-col gap-4">
              {[
                { tag: "#NetBookAI", posts: "12.4k" },
                { tag: "#Futurism", posts: "8.2k" },
                { tag: "#DigitalArt", posts: "5.1k" },
                { tag: "#Web3Social", posts: "3.9k" },
              ].map(t => (
                <div key={t.tag} className="flex flex-col cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all">
                  <div className="text-xs font-bold text-white">{t.tag}</div>
                  <div className="text-[9px] text-white/20">{t.posts} příspěvků</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#12121e] rounded-3xl border border-white/10 p-6">
            <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Online Přátelé</h4>
            <div className="flex flex-col gap-4">
              {DEMO_FRIENDS.map(f => (
                <div key={f.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowMsg(true)}>
                  <Avatar name={f.name} size={36} color={f.color} online={f.status === "online"} />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">{f.name}</div>
                    <div className={`text-[9px] ${f.status === "online" ? 'text-green-400' : 'text-white/20'}`}>
                      {f.status === "online" ? "● online" : f.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <AISidebar />
          </div>
        </aside>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a12]/80 backdrop-blur-2xl border-t border-white/5 px-6 h-20 flex items-center justify-between">
        {navItems.filter(item => ["feed", "explore", "studio", "music", "profile"].includes(item.id)).map(({ id, icon: Icon }) => (
          <button 
            key={id} 
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === id ? 'text-purple-400' : 'text-white/30'}`}
          >
            <Icon size={22} />
            <span className="text-[8px] font-bold uppercase tracking-widest">{id}</span>
          </button>
        ))}
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showCreate && <CreatePostModal user={user} onClose={() => setShowCreate(false)} onPost={addPost} />}
      </AnimatePresence>
      
      {showMsg && <Messenger user={user} friends={DEMO_FRIENDS} onClose={() => setShowMsg(false)} />}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
