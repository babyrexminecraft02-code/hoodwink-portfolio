import { useState, type FormEvent } from "react";

const logo = "https://framerusercontent.com/images/S0ybpNvVj60i1muQdAggq5HURg.svg?width=1024&height=1024";

const pieces = [
  {
    number: "01",
    title: "Alibi Hoodie",
    detail: "Reversible",
    price: "$128",
    image: "https://framerusercontent.com/images/3znyskGHh8RJIRhEl0aleA6teOg.jpg?width=1024&height=1024",
    note: "One side says stay hidden. The other says you were never hiding.",
  },
  {
    number: "02",
    title: "Decoy Jacket",
    detail: "Two collars",
    price: "$214",
    image: "https://framerusercontent.com/images/Rd4Z5t5OQbXBF8MQX3esr4DOnsM.jpg?width=1024&height=1024",
    note: "A familiar silhouette with an unfamiliar point of view.",
  },
  {
    number: "03",
    title: "False Bottom Cargo",
    detail: "Hidden pocket",
    price: "$146",
    image: "https://framerusercontent.com/images/JpUtjUmYkW41A5jjj3FrGXyUo.jpg?width=1024&height=1024",
    note: "The detail you miss is the detail that matters most.",
  },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <main className="site-shell">
      <header className="nav-wrap">
        <a className="brand-lockup" href="#top" aria-label="HoodWink home">
          <img src={logo} alt="HoodWink" />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#story">The story</a>
          <a href="#drop">The drop</a>
          <a href="#join">Early access</a>
        </nav>
        <a className="nav-mark" href="#join" aria-label="Join the early access list">↗</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-topline"><span>EST. 2026</span><span>Dhaka / Worldwide</span></div>
        <div className="hero-copy">
          <p className="eyebrow">A streetwear label</p>
          <h1>Built on<br /><em>the art of the reveal.</em></h1>
          <p className="hero-intro">A streetwear label built on the art of the reveal.</p>
          <a className="text-link" href="#join"><span>Get early access</span><b>↘</b></a>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>THE SECOND<br />READ</span>
          <span className="stamp-star">✳</span>
          <span>HOODWINK / 01</span>
        </div>
        <div className="hero-foot"><span>Scroll to discover</span><span className="scroll-line" /></div>
      </section>

      <section className="story section-grid" id="story">
        <div className="section-label"><span>01</span><span>What we believe</span></div>
        <div className="story-content">
          <p className="display-copy">A wink is a small deception everyone&apos;s in on. That&apos;s the label: clothes with a second read, built for people who like being the only ones who get the joke.</p>
          <div className="story-columns">
            <p>Every good trick has two audiences: the one who&apos;s tricked, and the second who&apos;s <em>in on it.</em></p>
            <p>HoodWink dresses the second kind. A silhouette that catches the eye of a person across the street and that you can call <em>Deceiving.</em></p>
          </div>
        </div>
      </section>

      <section className="drop" id="drop">
        <div className="drop-header section-grid">
          <div className="section-label"><span>02</span><span>The first drop</span></div>
          <div className="drop-heading"><h2>Six pieces.<br /><em>No restock.</em></h2><p>No restock, no re-run. Once a trick&apos;s been seen, it&apos;s over.</p></div>
        </div>
        <div className="pieces-grid">
          {pieces.map((piece) => (
            <article className="piece" key={piece.number}>
              <div className="piece-image-wrap">
                <span className="piece-index">{piece.number}</span>
                <img className="piece-image" src={piece.image} alt={piece.title} loading="lazy" />
                <span className="piece-reveal">{piece.note}</span>
              </div>
              <div className="piece-meta"><div><h3>{piece.title}</h3><p>{piece.detail}</p></div><strong>{piece.price}</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto section-grid">
        <div className="section-label"><span>03</span><span>In plain sight</span></div>
        <div className="manifesto-copy"><p>We don&apos;t sell a costume.</p><h2>We sell the moment<br />with a touch of art<br /><em>we call Trompe L&apos;oeil.</em></h2></div>
      </section>

      <section className="join" id="join">
        <div className="join-inner">
          <img src={logo} alt="" className="join-logo" />
          <p className="eyebrow">Know before it drops.</p>
          <h2>No spam.<br /><em>Just the good stuff.</em></h2>
          <p className="join-copy">No spam, no restocks announced twice. Just word, early, to the people already in on it. HoodWink never sells your information. That&apos;s the one trick we don&apos;t play.</p>
          {submitted ? (
            <div className="success-message" role="status">You&apos;re in. Keep your eyes open.</div>
          ) : (
            <form className="signup-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="email">Email address</label>
              <input id="email" type="email" required placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} />
              <button type="submit">Join the list <span>↗</span></button>
            </form>
          )}
        </div>
      </section>

      <footer className="footer"><span>HOODWINK / 2026</span><span>A trick, worn well.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}
