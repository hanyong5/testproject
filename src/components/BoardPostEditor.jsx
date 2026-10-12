import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const categories = ["공지", "제품소식", "이용가이드"];
const imageUrl = (path) => supabase.storage.from("board-images").getPublicUrl(path).data.publicUrl;

export default function BoardPostEditor({ userId, post, onSaved, onCancel }) {
  const [images, setImages] = useState(() => (post?.image_paths || []).map((path) => ({ id: path, path, url: imageUrl(path) })));
  const [pending, setPending] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const decoding = useRef(false);
  const generation = useRef(0);
  const urls = useRef(new Set());
  const picker = useRef(null);
  useEffect(() => {
    const resources = urls.current;
    return () => { generation.current += 1; resources.forEach((url) => URL.revokeObjectURL(url)); resources.clear(); };
  }, []);

  async function addFiles(files, replaceId = null) {
    if (busy.current || decoding.current || !files.length) return;
    if (files.length + images.length - (replaceId ? 1 : 0) > 3) {
      setError("이미지는 최대 3개까지 첨부할 수 있습니다. 기존 이미지를 삭제한 뒤 추가해 주세요."); return;
    }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError("각 파일은 JPG, PNG, WebP 형식의 5MB 이하 이미지여야 합니다."); return;
    }
    decoding.current = true; setProcessing(true); setError("");
    const current = generation.current;
    try {
      for (const file of files) { const bitmap = await createImageBitmap(file); bitmap.close(); }
      if (current !== generation.current) return;
      const added = files.map((file) => {
        const url = URL.createObjectURL(file); urls.current.add(url);
        return { id: crypto.randomUUID(), file, url };
      });
      if (replaceId) {
        const old = images.find((image) => image.id === replaceId);
        if (old?.file) { URL.revokeObjectURL(old.url); urls.current.delete(old.url); }
        setImages((value) => value.map((image) => image.id === replaceId ? added[0] : image));
      } else setImages((value) => [...value, ...added]);
    } catch { if (current === generation.current) setError("읽을 수 없는 이미지가 있습니다. 다른 파일을 선택해 주세요."); }
    finally { decoding.current = false; if (current === generation.current) setProcessing(false); }
  }

  function removeImage(image) {
    if (busy.current || decoding.current) return;
    if (image.file) { URL.revokeObjectURL(image.url); urls.current.delete(image.url); }
    setImages((value) => value.filter((item) => item.id !== image.id));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (busy.current || decoding.current) return;
    const values = new FormData(event.currentTarget);
    const update = { category: values.get("category"), title: values.get("title").trim(), content: values.get("content").trim(), image_paths: [] };
    if (!update.title || !update.content) { setError("제목과 내용을 입력해 주세요."); return; }
    busy.current = true; setPending(true); setError("");
    const uploaded = [];
    let committed = false;
    try {
      for (const image of images) {
        if (image.path) { update.image_paths.push(image.path); continue; }
        const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[image.file.type];
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: failure } = await supabase.storage.from("board-images").upload(path, image.file, { contentType: image.file.type });
        if (failure) throw failure;
        uploaded.push(path); update.image_paths.push(path);
      }
      let request = post ? supabase.from("board_posts").update(update).eq("id", post.id).eq("image_paths", `{${post.image_paths.join(",")}}`) : supabase.from("board_posts").insert(update);
      const { data, error: failure } = await request.select("id,category,title,content,created_at,image_paths").single();
      if (failure) throw failure;
      committed = true;
      const removed = (post?.image_paths || []).filter((path) => !update.image_paths.includes(path));
      let cleanupFailed = false;
      if (removed.length) {
        try { const result = await supabase.storage.from("board-images").remove(removed); cleanupFailed = Boolean(result.error); }
        catch { cleanupFailed = true; }
      }
      onSaved(data, cleanupFailed ? "저장했습니다. 이전 이미지 파일 정리는 완료되지 않았습니다." : "저장했습니다.");
    } catch (failure) {
      if (!committed && uploaded.length) await supabase.storage.from("board-images").remove(uploaded).catch(() => {});
      setError(failure.code === "42501" ? "관리자 권한이 필요합니다." : failure.code === "PGRST116" ? "글이 변경되었거나 수정 권한이 없습니다. 새로고침 후 다시 시도해 주세요." : "저장하지 못했습니다. 입력 내용은 유지됩니다. 연결 상태를 확인해 주세요.");
    } finally { busy.current = false; setPending(false); }
  }

  return <form className="board-editor" onSubmit={submit} aria-busy={pending || processing}>
    <h3>{post ? "게시글 및 이미지 수정" : "새 게시글 등록"}</h3>
    <fieldset disabled={pending || processing}>
      <label htmlFor="post-category">카테고리</label><select id="post-category" name="category" defaultValue={post?.category || categories[0]}>{categories.map((name) => <option key={name}>{name}</option>)}</select>
      <label htmlFor="post-title">제목</label><input id="post-title" name="title" defaultValue={post?.title || ""} required maxLength={150} />
      <label htmlFor="post-content">내용</label><textarea id="post-content" name="content" defaultValue={post?.content || ""} required maxLength={20000} rows={10} />
      <div className={`board-dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); if (!pending && !processing) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}>
        <p>이미지를 여기에 드래그하거나 파일을 선택하세요.</p>
        <button type="button" onClick={() => picker.current?.click()} disabled={images.length >= 3}>이미지 선택 ({images.length}/3)</button>
        <input ref={picker} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="첨부 이미지 선택" onChange={(event) => { addFiles(Array.from(event.target.files || [])); event.target.value = ""; }} />
        <p>최대 3개 · 각 5MB 이하 · JPG / PNG / WebP</p>
      </div>
      {processing && <p role="status">이미지 확인 중…</p>}
      <div className="board-image-grid">{images.map((image, index) => <figure className="board-image-preview" key={image.id}>
        <img src={image.url} alt={`첨부 이미지 ${index + 1} 미리보기`} />
        <figcaption>{image.file?.name || `기존 이미지 ${index + 1}`}</figcaption>
        <label>이미지 교체<input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`이미지 ${index + 1} 교체`} onChange={(event) => { addFiles(Array.from(event.target.files || []), image.id); event.target.value = ""; }} /></label>
        <button type="button" onClick={() => removeImage(image)}>이미지 삭제</button>
      </figure>)}</div>
      <p>이미지 추가·교체·삭제는 저장 후 반영됩니다. 글과 이미지는 방문자에게 공개됩니다.</p>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="board-edit-actions"><button type="submit" className="nexis-cta">{pending ? "저장 중…" : post ? "수정 사항 저장" : "게시글 등록"}</button>{onCancel && <button type="button" onClick={onCancel}>취소</button>}</div>
    </fieldset>
  </form>;
}
