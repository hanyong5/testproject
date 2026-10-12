import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Camera, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../lib/useAuth";
import { useRole } from "../lib/useRole";
import { supabase } from "../lib/supabase";
import { createAvatarThumbnail } from "../lib/avatarThumbnail";
import "./Profile.css";

const defaults = { full_name: "", nickname: "", phone: "", bio: "", avatar_style: "blue", avatar_path: null };
const styles = { blue: "블루", purple: "퍼플", green: "그린", orange: "오렌지" };

export default function Profile() {
  const { session, loading } = useAuth();
  if (loading) return <p role="status">계정을 확인하고 있습니다…</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <ProfileEditor key={session.user.id} user={session.user} />;
}

function ProfileEditor({ user }) {
  const { role, loading: roleLoading, error: roleError } = useRole(user.id);
  const [profile, setProfile] = useState(defaults);
  const [savedPath, setSavedPath] = useState(null);
  const [photo, setPhoto] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const uploadInput = useRef(null);
  const previewUrl = useRef(null);
  const savedFile = useRef(null);
  const selection = useRef(0);

  useEffect(() => {
    let active = true;
    let objectUrl;
    async function load() {
      try {
        const { data, error: failure } = await supabase.from("profiles").select("full_name,nickname,phone,bio,avatar_style,avatar_path").eq("id", user.id).maybeSingle();
        if (failure) throw failure;
        if (!active) return;
        setProfile(data || defaults);
        setSavedPath(data?.avatar_path || null);
        if (data?.avatar_path) {
          const { data: blob, error: imageError } = await supabase.storage.from("avatars").download(data.avatar_path);
          if (!active) return;
          if (imageError) setError("사진을 불러오지 못했습니다. 다시 사진을 선택하거나 페이지를 새로고침해 주세요.");
          else {
            const thumbnail = await createAvatarThumbnail(blob);
            if (!active) return;
            objectUrl = URL.createObjectURL(thumbnail); setPhoto(objectUrl);
            // Older uploads are replaced with a thumbnail on the next explicit save.
            if (blob.size > thumbnail.size) setFile(thumbnail);
          }
        }
      } catch {
        if (active) { setLoadError(true); setError("회원정보를 불러오지 못했습니다. 다시 시도해 주세요."); }
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [user.id, retry]);

  useEffect(() => () => { selection.current += 1; if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);

  function change(event) {
    setProfile((value) => ({ ...value, [event.target.name]: event.target.value }));
    setMessage("");
  }

  async function choosePhoto(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 2 * 1024 * 1024) {
      setError("JPG, PNG, WebP 이미지로 2MB 이하의 파일을 선택해 주세요.");
      return;
    }
    setError("");
    const request = ++selection.current;
    setProcessing(true);
    try {
      const thumbnail = await createAvatarThumbnail(selected);
      if (selection.current !== request) return;
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = URL.createObjectURL(thumbnail);
      setPhoto(previewUrl.current);
      setFile(thumbnail);
    } catch {
      if (selection.current === request) setError("이미지를 변환하지 못했습니다. 다른 사진을 선택해 주세요.");
    } finally {
      if (selection.current === request) setProcessing(false);
    }
  }

  function chooseStyle(style) {
    setFile(null); setPhoto(""); setMessage(""); setError("");
    setProfile((value) => ({ ...value, avatar_style: style, avatar_path: null }));
  }

  async function save(event) {
    event.preventDefault();
    if (busy.current || processing || loading || loadError) return;
    busy.current = true; setPending(true); setMessage(""); setError("");
    let uploadedPath = null;
    let committed = false;
    try {
      let path = profile.avatar_path;
      if (file && file !== savedFile.current) {
        const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
        path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        uploadedPath = path;
      }
      const next = { ...profile, full_name: profile.full_name.trim(), nickname: profile.nickname.trim(), phone: profile.phone.trim(), bio: profile.bio.trim(), avatar_path: path };
      const { error: saveError } = await supabase.from("profiles").upsert({ id: user.id, ...next });
      if (saveError) throw saveError;
      committed = true;
      setProfile(next); setSavedPath(path);
      savedFile.current = file;
      setMessage("회원정보를 저장했습니다.");
      if (savedPath && savedPath !== path) {
        const { error: cleanupError } = await supabase.storage.from("avatars").remove([savedPath]);
        if (cleanupError) setMessage("회원정보를 저장했습니다. 이전 사진 정리는 완료되지 않았습니다.");
      }
    } catch {
      if (!committed && uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]).catch(() => {});
      setError(committed ? "정보는 저장되었지만 사진 표시를 갱신하지 못했습니다. 새로고침해 주세요." : "저장하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.");
    } finally { busy.current = false; setPending(false); }
  }

  return <section className="profile-page" aria-labelledby="profile-title">
    <p className="profile-kicker">MY NEXIS</p>
    <h1 id="profile-title">나의 회원정보</h1>
    <p className="profile-intro">나를 소개하는 정보와 아바타를 완성해 보세요.</p>
    {loading ? <p role="status">회원정보를 불러오는 중…</p> : loadError ? <div><p role="alert">{error}</p><button className="profile-save" onClick={() => { setLoading(true); setLoadError(false); setError(""); setRetry((value) => value + 1); }}>다시 시도</button></div> :
    <form onSubmit={save} aria-busy={pending || processing}>
      <fieldset disabled={pending || processing} className="profile-grid">
        <aside className="profile-card profile-avatar-panel">
          <div className={`profile-avatar avatar-${profile.avatar_style}`}>
            {photo ? <img src={photo} alt="나의 아바타" onError={() => { setPhoto(""); setError("이미지를 표시할 수 없습니다. 다른 사진을 선택해 주세요."); }} /> : <UserRound size={64} aria-hidden="true" />}
          </div>
          <h2>{profile.nickname || "나만의 아바타"}</h2>
          <p>사진을 올리거나 기본 아바타를 선택하세요.</p>
          <input ref={uploadInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} className="sr-only" aria-label="아바타 사진 파일" tabIndex={-1} />
          <button type="button" className="profile-upload" onClick={() => uploadInput.current?.click()}><Camera size={17} aria-hidden="true" /> 사진 선택</button>
          <p className="profile-hint">JPG · PNG · WebP / 원본 최대 2MB<br />256 × 256 썸네일 · 저장 용량 최대 100KB</p>
          <p className="profile-hint" role="status">{processing ? "사진을 작게 압축하고 있습니다…" : file ? `썸네일 ${Math.ceil(file.size / 1024)}KB · 저장하면 적용됩니다.` : "사진 중앙을 정사각형으로 잘라 저장합니다."}</p>
          <div className="profile-swatches" aria-label="기본 아바타 색상">
            {Object.entries(styles).map(([value, label]) => <button type="button" key={value} className={`avatar-${value}`} onClick={() => chooseStyle(value)} aria-label={`${label} 기본 아바타`} aria-pressed={!photo && profile.avatar_style === value}><UserRound size={22} aria-hidden="true" /></button>)}
          </div>
          <p className="profile-private"><ShieldCheck size={16} aria-hidden="true" /> 정보와 사진은 본인만 조회할 수 있습니다.</p>
        </aside>
        <div className="profile-card profile-fields">
          <h2>기본 정보</h2>
          <p className="profile-hint">회원 등급: {roleLoading ? "확인 중…" : roleError ? "확인 실패 — 새로고침해 주세요" : role === "admin" ? "admin (관리자)" : "user (일반 회원)"}</p>
          <div><label htmlFor="profile-email">이메일</label><input id="profile-email" type="email" value={user.email || ""} readOnly /><p className="profile-hint">가입한 이메일은 이 페이지에서 변경할 수 없습니다.</p></div>
          <div className="profile-row">
            <div><label htmlFor="full_name">이름 <span>(선택)</span></label><input id="full_name" name="full_name" value={profile.full_name} onChange={change} maxLength={80} autoComplete="name" placeholder="이름을 입력하세요" /></div>
            <div><label htmlFor="nickname">닉네임 <span>(선택)</span></label><input id="nickname" name="nickname" value={profile.nickname} onChange={change} maxLength={40} autoComplete="nickname" placeholder="어떻게 불러드릴까요?" /></div>
          </div>
          <div><label htmlFor="phone">연락처 <span>(선택)</span></label><input id="phone" name="phone" type="tel" value={profile.phone} onChange={change} maxLength={30} autoComplete="tel" placeholder="010-0000-0000" /></div>
          <div><label htmlFor="bio">자기소개 <span>(선택)</span></label><textarea id="bio" name="bio" value={profile.bio} onChange={change} maxLength={500} rows={4} placeholder="나를 소개하는 짧은 이야기를 남겨주세요." /><p className="profile-hint">{profile.bio.length} / 500</p></div>
          {error && <p className="profile-error" role="alert">{error}</p>}
          {message && <p className="profile-success" role="status">{message}</p>}
          <div className="profile-actions"><p>변경 사항은 저장 후 적용됩니다.</p><button type="submit" className="profile-save">{pending ? "저장 중…" : "변경 사항 저장"}</button></div>
        </div>
      </fieldset>
    </form>}
  </section>;
}
