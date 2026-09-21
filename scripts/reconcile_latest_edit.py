from pathlib import Path
import re

path = Path('/home/ubuntu/hoodwink-portfolio/client/src/pages/Home.tsx')
s = path.read_text()

# Apply copy/data changes without introducing inline styling that overrides the design system.
s = s.replace('detail: "Reversible"', 'detail: "* 1x1 RIB KNIT COLLAR *\\n* 100% COTTON *\\n* CREW-NECK *\\n* 200GSM"')
s = s.replace('title: "Alibi Hoodie"', 'title: "HoodWink Tee"')
s = s.replace('title: "Decoy Jacket"', 'title: "EXPTL. Band Tee"')
s = s.replace('title: "False Bottom Cargo"', 'title: "Muscle Memory Tee"')
s = s.replace('No restock, no re-run. Once a trick&apos;s been seen, it&apos;s over.', 'No re-run. Once a trick&apos;s been seen, it&apos;s over.')

# Replace the expanded malformed drop section with the original semantic structure.
start = s.index('      <section className="drop"')
end = s.index('\n\n      <section className="manifesto', start)
new_drop = '''      <section className="drop" id="drop"><div className="drop-header section-grid"><div className="section-label"><Editable id="drop-index" label="Drop section number" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag}>02</Editable><Editable id="drop-label" label="Drop section label" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag}>The first drop</Editable></div><div className="drop-heading"><Editable id="drop-title" label="Drop title" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} className="drop-title" style={styleFor("drop-title")}>Six pieces.<br /><em>No restock.</em></Editable><Editable id="drop-subtitle" label="Drop subtitle" editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} style={styleFor("drop-subtitle")}>No re-run. Once a trick&apos;s been seen, it&apos;s over.</Editable></div></div><div className="pieces-grid">{pieces.map((piece) => <article className="piece" key={piece.number}><div className="piece-image-wrap"><Editable id={`piece-${piece.number}`} label={`${piece.title} image`} editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag}><img className="piece-image" src={imageFor(`piece-${piece.number}`, piece.image)} alt={piece.title} loading="lazy" /></Editable>{editMode && selectedId === `piece-${piece.number}` && <span className="image-edit-badge">Image selected</span>}<Editable id={`piece-note-${piece.number}`} label={`${piece.title} reveal note`} editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag} className="piece-reveal">{piece.note}</Editable></div><div className="piece-meta"><div><Editable id={`piece-title-${piece.number}`} label={`${piece.title} title`} editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag}><h3>{piece.title}</h3></Editable><Editable id={`piece-detail-${piece.number}`} label={`${piece.title} detail`} editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag}><p>{piece.detail}</p></Editable></div><Editable id={`piece-price-${piece.number}`} label={`${piece.title} price`} editMode={editMode} selectedId={selectedId} onSelect={setSelectedId} onPointerDown={startDrag}><strong>{piece.price}</strong></Editable></div></article>)}</div></section>'''
s = s[:start] + new_drop + s[end:]
path.write_text(s)

css = Path('/home/ubuntu/hoodwink-portfolio/client/src/index.css')
c = css.read_text()
c = c.replace('.story { background: var(--paper); }', '.story { position: relative; background: var(--paper); isolation: isolate; }\n.story::before { content: ""; position: absolute; z-index: -1; left: 7%; top: 23%; width: 42%; height: 54%; pointer-events: none; background: radial-gradient(circle, rgba(63,163,116,.16), transparent 68%); filter: blur(24px); }\n.story .section-label { align-self: center; }\n.story-display { text-shadow: 0 0 22px rgba(63,163,116,.14); }')
c = c.replace('.story-columns { display: grid;', '.story-columns { display: grid;')
c = c.replace('.piece-meta p, .piece-meta strong { margin-top: 5px; color: var(--green-bright); font: 400 10px var(--mono); text-transform: uppercase; letter-spacing: .07em; }', '.piece-meta p, .piece-meta strong { margin-top: 5px; color: var(--green-bright); font: 400 10px/1.55 "Helvetica Neue", Helvetica, Arial, sans-serif; text-transform: uppercase; letter-spacing: .07em; white-space: pre-line; }')
css.write_text(c)
