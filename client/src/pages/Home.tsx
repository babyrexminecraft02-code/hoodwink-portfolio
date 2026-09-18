import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

const logo = "https://framerusercontent.com/images/S0ybpNvVj60i1muQdAggq5HURg.svg?width=1024&height=1024";
const STORAGE_KEY = "hoodwink-editor-state-v1";

type EditValue = {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  letterSpacing?: number;
  x?: number;
  y?: number;
};

type EditorState = {
  edits: Record<string, EditValue>;
  images: Record<string, string>;
};

const defaultState: EditorState = { edits: {}, images: {} };

const pieces = [
  { number: "01", title: "Alibi Hoodie", detail: "Reversible", price: "$128", image: "https://framerusercontent.com/images/3znyskGHh8RJIRhEl0aleA6teOg.jpg?width=1024&height=1024", note: "One side says stay hidden. The other says you were never hiding." },
  { number: "02", title: "Decoy Jacket", detail: "Two collars", price: "$214", image: "https://framerusercontent.com/images/Rd4Z5t5OQbXBF8MQX3esr4DOnsM.jpg?width=1024&height=1024", note: "A familiar silhouette with an unfamiliar point of view." },
  { number: "03", title: "False Bottom Cargo", detail: "Hidden pocket", price: "$146", image: "https://framerusercontent.com/images/JpUtjUmYkW41A5jjj3FrGXyUo.jpg?width=1024&height=1024", note: "The detail you miss is the detail that matters most." },
];

const fontOptions = [
  { label: "Fraunces / display", value: "Fraunces, Georgia, serif" },
  { label: "DM Sans / body", value: "DM Sans, Arial, sans-serif" },
  { label: "DM Mono / label", value: "DM Mono, monospace" },
  { label: "Archivo / original", value: "Archivo, Arial, sans-serif" },
];

function readStoredState(): EditorState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
  } catch {
    return defaultState;
  }
}

function Editable({ id, label, editMode, selectedId, onSelect, onPointerDown, style, children, className = "" }: {
  id: string;
  label: string;
  editMode: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, id: string) => void;
  style?: CSSProperties;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      data-edit-id={id}
      data-edit-label={label}
      className={`${className} ${editMode ? "edit-target" : ""} ${selectedId === id ? "edit-target-selected" : ""}`}
      style={style}
      onClick={(event) => { if (editMode) { event.preventDefault(); event.stopPropagation(); onSelect(id); } }}
      onPointerDown={(event) => { if (editMode) onPointerDown(event, id); }}
    >
      {children}
    </span>
  );
}

export default function Home() {
  const [editMode, setEditMode] = useState(false);
  const [state, setState] = useState<EditorState>(defaultState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [guidePoint, setGuidePoint] = useState({ x: 50, y: 50 });
  const [canvasTab, setCanvasTab] = useState<"site" | "edit">("site");
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef({ id: "", startX: 0, startY: 0, originX: 0, originY: 0 });

  const assist = trpc.editor.assist.useMutation();
  const generate = trpc.editor.generateImage.useMutation();
  const currentEdit = selectedId ? state.edits[selectedId] ?? {} : {};
  const selectedLabel = selectedId ? selectedId.replaceAll("-", " ") : "Nothing selected";

  useEffect(() => { setState(readStoredState()); }, []);
  useEffect(() => {
    if (!editMode) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault(); saveState();
      }
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editMode, state]);

  function updateEdit(id: string, patch: EditValue) {
    setState((previous) => ({ ...previous, edits: { ...previous.edits, [id]: { ...previous.edits[id], ...patch } } }));
    setSaved(false);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function resetState() {
    if (!window.confirm("Reset all local edits and uploaded images?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    setSelectedId(null);
  }

  function exportState() {
    const file = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hoodwink-edit.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, id: string) {
    if (!editMode) return;
    const target = event.currentTarget as HTMLElement;
    if (target.dataset.editId !== id) return;
    event.preventDefault();
    setSelectedId(id);
    setIsDragging(true);
    dragRef.current = { id, startX: event.clientX, startY: event.clientY, originX: state.edits[id]?.x ?? 0, originY: state.edits[id]?.y ?? 0 };
    target.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!isDragging) return;
    const { id, startX, startY, originX, originY } = dragRef.current;
    const nextX = Math.round(originX + (event.clientX - startX));
    const nextY = Math.round(originY + (event.clientY - startY));
    setGuidePoint({ x: Math.max(8, Math.min(92, 50 + nextX / 10)), y: Math.max(8, Math.min(92, 50 + nextY / 10)) });
    updateEdit(id, { x: nextX, y: nextY });
  }

  function endDrag() { setIsDragging(false); }

  function styleFor(id: string): CSSProperties {
    const item = state.edits[id];
    if (!item) return {};
    return {
      ...(item.fontFamily ? { fontFamily: item.fontFamily } : {}),
      ...(item.fontSize ? { fontSize: `${item.fontSize}px` } : {}),
      ...(item.color ? { color: item.color } : {}),
      ...(item.letterSpacing !== undefined ? { letterSpacing: `${item.letterSpacing}px` } : {}),
      ...(item.x || item.y ? { position: "relative", left: `${item.x ?? 0}px`, top: `${item.y ?? 0}px` } : {}),
    };
  }

  async function applyAiEdit() {
    if (!prompt.trim()) return;
    const result = await assist.mutateAsync({ prompt, selectedId: selectedId ?? "page", selectedLabel, currentText: currentEdit.text ?? "" });
    if (selectedId) updateEdit(selectedId, result.patch);
    setPrompt("");
  }

  async function createAiImage() {
    if (!prompt.trim()) return;
    const result = await generate.mutateAsync({ prompt });
    const imageUrl = result.url;
    if (!imageUrl) return;
    const target = selectedId ?? "hero-art";
    setState((previous) => ({ ...previous, images: { ...previous.images, [target]: imageUrl } }));
    setPrompt("");
    setSelectedId(target);
  }

  function handleLocalFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const target = selectedId ?? "hero-art";
    const reader = new FileReader();
    reader.onload = () => {
      setState((previous) => ({ ...previous, images: { ...previous.images, [target]: String(reader.result) } }));
      setSelectedId(target);
      setSaved(false);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (email.trim()) setSubmitted(true); }
  const heroImage = state.images["hero-art"];
  const imageFor = (id: string, fallback: string) => state.images[id] ?? fallback;
  const isBusy = assist.isPending || generate.isPending;
  const activeStyle = useMemo(() => styleFor(selectedId ?? ""), [state, selectedId]);

  return (
    <main className={`site-shell ${editMode ? "is-editing" : ""}`} onPointerMove={moveDrag} onPointerUp={endDrag}>
      <header className="nav-wrap">
        <a className="brand-lockup" href="#top" aria-label="HoodWink home"><img src={logo} alt="HoodWink" /></a>
        <nav className="desktop-nav" aria-label="Primary navigation"><a href="#story">The story</a><a href="#drop">The drop</a><a href="#join">Early access</a></nav>
        <div className="nav-actions">
          <button className={`edit-toggle ${editMode ? "active" : ""}`} onClick={() => setEditMode((value) => !value)}>{editMode ? "Exit edit" : "Edit mode"}</button>
          <a className="nav-mark" href="#join" aria-label="Join the early access list">↗</a>
        </div>
      </header>

      {editMode && (
        <aside className="editor-panel" aria-label="HoodWink edit mode panel">
          <div className="editor-panel-head"><div><span className="panel-kicker">HoodWink / Studio</span><h2>Edit mode</h2></div><button className="panel-close" onClick={() => setEditMode(false)} aria-label="Close edit mode">×</button></div>
          <div className="editor-tabs"><button className={canvasTab === "site" ? "active" : ""} onClick={() => setCanvasTab("site")}>Canvas</button><button className={canvasTab === "edit" ? "active" : ""} onClick={() => setCanvasTab("edit")}>AI edit</button></div>
          {canvasTab === "site" ? (
            <>
              <div className="selection-card"><span className="panel-kicker">Selected element</span><strong>{selectedLabel}</strong><small>{selectedId ? "Drag directly on canvas to move" : "Click any outlined element"}</small></div>
              <div className="control-section"><div className="control-title">Type</div><label>Font<select value={currentEdit.fontFamily ?? ""} onChange={(event) => selectedId && updateEdit(selectedId, { fontFamily: event.target.value || undefined })}><option value="">Original font</option>{fontOptions.map((font) => <option value={font.value} key={font.value}>{font.label}</option>)}</select></label><div className="control-row"><label>Size<input type="number" min="8" max="180" value={currentEdit.fontSize ?? ""} onChange={(event) => selectedId && updateEdit(selectedId, { fontSize: event.target.value ? Number(event.target.value) : undefined })} /></label><label>Tracking<input type="number" min="-4" max="30" step=".5" value={currentEdit.letterSpacing ?? ""} onChange={(event) => selectedId && updateEdit(selectedId, { letterSpacing: event.target.value ? Number(event.target.value) : undefined })} /></label></div></div>
              <div className="control-section"><div className="control-title">Colour</div><div className="color-row"><input type="color" value={currentEdit.color ?? "#e9e5db"} onChange={(event) => selectedId && updateEdit(selectedId, { color: event.target.value })} /><input className="color-text" value={currentEdit.color ?? "#e9e5db"} onChange={(event) => selectedId && updateEdit(selectedId, { color: event.target.value })} /></div></div>
              <div className="control-section"><div className="control-title">Assets</div><button className="editor-button secondary" onClick={() => fileInputRef.current?.click()}>＋ Add local image</button><input ref={fileInputRef} className="file-input" type="file" accept="image/*" onChange={handleLocalFile} /><button className="editor-button secondary" onClick={exportState}>↓ Export edit file</button></div>
              <div className="editor-footer-actions"><button className="editor-button primary" onClick={saveState}>{saved ? "Saved to this browser" : "Save changes"}</button><button className="text-button" onClick={resetState}>Reset</button></div>
              <p className="panel-note">Your edits are stored locally in this browser. Export the edit file to keep a portable backup.</p>
            </>
          ) : (
            <>
              <div className="ai-intro"><span className="ai-spark">✦</span><div><strong>Describe the change.</strong><p>AI can rewrite copy, restyle the selected element, or make a new image.</p></div></div>
              <textarea className="prompt-box" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Make the hero headline more mysterious…" rows={5} />
              <button className="editor-button primary ai-button" onClick={applyAiEdit} disabled={isBusy || !prompt.trim()}>{assist.isPending ? "Thinking…" : "Apply AI edit"}<span>↗</span></button>
              <button className="editor-button secondary ai-button" onClick={createAiImage} disabled={isBusy || !prompt.trim()}>{generate.isPending ? "Creating image…" : "Generate image from prompt"}<span>✦</span></button>
              <div className="prompt-examples"><span>Try a prompt</span><button onClick={() => setPrompt("Rewrite this headline to feel more enigmatic, keep it under 7 words")}>Rewrite headline</button><button onClick={() => setPrompt("Make this element feel warmer with an ochre editorial colour")}>Warm the colour</button><button onClick={() => setPrompt("Create an editorial fashion campaign image with deep green shadows and flash photography")}>Generate campaign image</button></div>
              {(assist.error || generate.error) && <p className="error-note">{assist.error?.message ?? generate.error?.message ?? "Something went wrong."}</p>}
              <p className="panel-note">AI actions use the project&apos;s secure server connection. Image generation may take a few seconds.</p>
            </>
          )}
          <button className="help-link" onClick={() => setShowHelp((value) => !value)}>⌘ How edit mode works</button>
          {showHelp && <div className="help-card">Select an element by clicking it. Drag to move it; the center guides help you align the composition. Use Canvas for precise type and colour controls. Use AI edit for natural-language changes.</div>}
        </aside>
      )}

      <section className="hero" id="top" onClick={(event) => { if (editMode && event.target === event.currentTarget) setSelectedId(null); }}>
        <div className="hero-topline"><span>EST. 2026</span><span>Dhaka / Worldwide</span></div>
        <div className="hero-copy">
          <Editable id="hero-eyebrow" label="Hero eyebrow" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} className="eyebrow" style={styleFor("hero-eyebrow")}>A streetwear label</Editable>
          <Editable id="hero-title" label="Hero title" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} className="hero-title" style={styleFor("hero-title")}>Built on<br /><em>the art of the reveal.</em></Editable>
          <Editable id="hero-intro" label="Hero intro" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} className="hero-intro" style={styleFor("hero-intro")}>A streetwear label built on the art of the reveal.</Editable>
          <a className="text-link" href="#join"><span>Get early access</span><b>↘</b></a>
        </div>
        <div className={`hero-stamp ${heroImage ? "has-generated-image" : ""}`} aria-hidden="true" style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}><span>THE SECOND<br />READ</span><span className="stamp-star">✳</span><span>HOODWINK / 01</span></div>
        <div className="hero-foot"><span>Scroll to discover</span><span className="scroll-line" /></div>
        {editMode && isDragging && <div className="canvas-guides"><span className="guide-x" style={{ left: `${guidePoint.x}%` }} /><span className="guide-y" style={{ top: `${guidePoint.y}%` }} /><span className="guide-label">ALIGN</span></div>}
      </section>

      <section className="story section-grid" id="story"><div className="section-label"><span>01</span><span>What we believe</span></div><div className="story-content"><Editable id="story-display" label="Story manifesto" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} className="display-copy" style={styleFor("story-display")}>{state.edits["story-display"]?.text ?? "A wink is a small deception everyone's in on. That's the label: clothes with a second read, built for people who like being the only ones who get the joke."}</Editable><div className="story-columns"><Editable id="story-audience" label="Story audience copy" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} style={styleFor("story-audience")}>Every good trick has two audiences: the one who's tricked, and the second who's <em>in on it.</em></Editable><Editable id="story-dresses" label="Story product copy" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} style={styleFor("story-dresses")}>HoodWink dresses the second kind. A silhouette that catches the eye of a person across the street and that you can call <em>Deceiving.</em></Editable></div></div></section>

      <section className="drop" id="drop"><div className="drop-header section-grid"><div className="section-label"><span>02</span><span>The first drop</span></div><div className="drop-heading"><Editable id="drop-title" label="Drop title" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} className="drop-title" style={styleFor("drop-title")}>Six pieces.<br /><em>No restock.</em></Editable><Editable id="drop-subtitle" label="Drop subtitle" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} style={styleFor("drop-subtitle")}>No restock, no re-run. Once a trick&apos;s been seen, it&apos;s over.</Editable></div></div><div className="pieces-grid">{pieces.map((piece) => <article className="piece" key={piece.number}><div className="piece-image-wrap"><span className="piece-index">{piece.number}</span><img className="piece-image" src={imageFor(`piece-${piece.number}`, piece.image)} alt={piece.title} loading="lazy" onClick={() => editMode && setSelectedId(`piece-${piece.number}`)} />{editMode && selectedId === `piece-${piece.number}` && <span className="image-edit-badge">Image selected</span>}<span className="piece-reveal">{piece.note}</span></div><div className="piece-meta"><div><h3>{piece.title}</h3><p>{piece.detail}</p></div><strong>{piece.price}</strong></div></article>)}</div></section>

      <section className="manifesto section-grid"><div className="section-label"><span>03</span><span>In plain sight</span></div><div className="manifesto-copy"><Editable id="manifesto" label="Manifesto close" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} style={styleFor("manifesto")}><p>We don&apos;t sell a costume.</p><h2>We sell the moment<br />with a touch of art<br /><em>we call Trompe L&apos;oeil.</em></h2></Editable></div></section>

      <section className="join" id="join"><div className="join-inner"><img src={logo} alt="" className="join-logo" /><p className="eyebrow">Know before it drops.</p><h2>No spam.<br /><em>Just the good stuff.</em></h2><p className="join-copy">No spam, no restocks announced twice. Just word, early, to the people already in on it. HoodWink never sells your information. That&apos;s the one trick we don&apos;t play.</p>{submitted ? <div className="success-message" role="status">You&apos;re in. Keep your eyes open.</div> : <form className="signup-form" onSubmit={handleSubmit}><label className="sr-only" htmlFor="email">Email address</label><input id="email" type="email" required placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} /><button type="submit">Join the list <span>↗</span></button></form>}</div></section>
      <footer className="footer"><span>HOODWINK / 2026</span><span>A trick, worn well.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}
