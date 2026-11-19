import Image from 'next/image';
import QuoteForm from './components/QuoteForm';
import FunnelTracker from './components/FunnelTracker';
import { HeroQuiz, PickTypeLink, StickyCta, UploadCta, ViewContentObserver } from './components/Interactive';
import { BUSINESS, PATCH_TYPES } from '@/lib/options';
import { withBase } from '@/lib/base';

// Offers confirmed by the client: free mockup in 24 hours, no minimum order, free shipping, money back guarantee.
// From futurepvcpatch.com: custom design by their team, best quality, durable 3D PVC, big orders small prices,
// worldwide shipping, secure payments, discounts and coupons, and the customer reviews below.

const Arrow = () => (
  <span className="cta-arrow">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  </span>
);

const CtaRow = ({ id, label = 'Get my free quote' }: { id: string; label?: string }) => (
  <div className="cta-row">
    <a href="#quote" className="btn cta-main" data-cta={id}>{label}<Arrow /></a>
    <span>Free mockup in 24 hours. Takes about a minute.</span>
  </div>
);

const INCLUDED = [
  ['i-box', 'No Minimum Order', 'Order one patch or thousands'],
  ['i-clock', 'Free Mockup in 24 Hours', 'See your patch before you approve anything'],
  ['i-truck', 'Free Shipping', 'Delivered to your door at no extra cost'],
  ['i-gift', 'Money Back Guarantee', 'Not happy with your patches? Get your money back'],
  ['i-pencil', 'Custom Design', 'Give us your concept and our designers bring it to life'],
  ['i-star', 'Big Orders, Small Prices', 'The more you order, the less you pay per patch'],
];

const WHY = [
  ['3D PVC', 'Raised, dimensional rubber patches that stand out.'],
  ['Durable', 'Tough rubber PVC built for jackets, caps, bags and gear.'],
  ['Free shipping', 'We deliver to customers all over the world.'],
];

const PROMISES = [
  ['i-gift', 'Money back guarantee', 'If your patches are not right, you get your money back. Simple as that.'],
  ['i-pencil', 'We design your idea', 'Share a logo, sketch or just an idea. Our design team turns it into a patch that matches your vision.'],
  ['i-check', 'Safe, secure payment', 'Advanced encryption and trusted payment gateways protect your information at checkout.'],
  ['i-phone', 'Clear communication', 'Talk to our team on WhatsApp or email from your first question to delivery.'],
];

const STEPS = [
  { title: 'Tell us what you need', text: 'Pick your product, size and quantity. It takes about a minute.', img: withBase('/assets/art/step-1.webp'), accent: '#1F3B83' },
  { title: 'Send your artwork', text: 'Upload your logo, sketch or photo. Our design team checks every file.', img: withBase('/assets/art/step-2.webp'), accent: '#0B6FB0' },
  { title: 'Get your quote and free mockup', text: 'We send your price and mockup on WhatsApp within 24 hours. Production starts only when you approve.', img: withBase('/assets/art/step-3.webp'), accent: '#0392C6' },
];

const MADE_FOR: { label: string; img: string; alt: string }[] = [
  { label: 'Clothing brands', img: withBase('/assets/art/made-brands.webp'), alt: 'Hoodies and jackets on a clothing rack, each with a custom patch' },
  { label: 'Streetwear labels', img: withBase('/assets/art/made-streetwear.webp'), alt: 'Denim jacket back covered in colorful custom patches on a city street' },
  { label: 'Small businesses', img: withBase('/assets/art/made-small-business.webp'), alt: 'Coffee shop apron with a custom patch on the chest' },
  { label: 'Sports teams', img: withBase('/assets/art/made-teams.webp'), alt: 'Team jerseys and caps with custom patches in a locker room' },
  { label: 'Clubs and events', img: withBase('/assets/art/made-clubs.webp'), alt: 'Leather motorcycle club vest with large custom back patches' },
];

const REVIEWS = [
  { name: 'Jessica Foxx', text: 'I recently launched a new business selling sports team apparel. Future PVC Patch has provided us with high-quality custom-designed t-shirts and hoodies.' },
  { name: 'Lily Granger', text: "Future PVC Patch has been a fantastic experience. We are pleased to have excellent quality patches on our motorcycle club's clothing." },
  { name: 'Daniel R.', text: 'Consistent product quality and clear communication throughout the production cycle. Orders were delivered on schedule without issues.' },
];

const FAQ: [string, string][] = [
  ['How much do custom PVC patches cost?', 'It depends on the size, the detail and the quantity. Send your request and we reply with a clear price and a free mockup within 24 hours. Bigger orders get a lower price per patch.'],
  ['Is there a minimum order?', 'No. Order one patch or thousands. Bigger orders get a lower price per patch.'],
  ['Are the mockup and shipping really free?', 'Yes. You get a free mockup within 24 hours, and shipping is free.'],
  ['What if I am not happy with my patches?', 'Every order comes with our money back guarantee. Tell us what is wrong and we make it right or give your money back.'],
  ['Can you design my patch for me?', 'Absolutely. Share your logo, sketch or idea and our design team creates a patch that matches your vision.'],
  ['What can you make besides patches?', 'We make 3D PVC patches, PVC key chains, stickers, t-shirts and hoodies on custom demand.'],
  ['Do you ship to my country?', 'Yes. We deliver worldwide, and shipping is free.'],
  ['Is my payment safe?', 'Yes. We use advanced encryption and trusted payment gateways to keep your information safe and private.'],
  ['Do you offer discounts?', 'Yes. Bigger orders get better prices, and we run special offers and coupons. Ask about current deals with your quote.'],
  ['How do I talk to you?', 'Send your request and we reply on WhatsApp with your quote code and details. You can also email us any time.'],
  ['Which file types can I upload?', 'PNG, JPG, JPEG, PDF, AI, EPS and SVG. A clear photo of a sketch works too.'],
];

export default function Page() {
  const bySlug = Object.fromEntries(PATCH_TYPES.map((t) => [t.key, t]));
  // Phones show the survey right under the headline; wider screens show it beside the copy.
  const quizTypes = PATCH_TYPES.map((t) => ({ label: t.label, img: t.img }));
  return (
    <div className="bgp" style={{ minHeight: '100%' }}>
      <div className="announce">
        <span>No minimum order</span>
        <span style={{ color: 'var(--yellow)' }}>Free mockup in 24 hours</span>
        <span>Free shipping and money back guarantee</span>
      </div>

      <header className="topbar">
        <a href="#top" className="brand" aria-label={`${BUSINESS.name} home`}>
          <Image src={withBase('/assets/logo-160.webp')} alt="" width={160} height={160} priority style={{ display: 'block', width: 64, height: 64 }} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <strong className="hd brand-name">{BUSINESS.nameUpper}</strong>
            <span className="brand-tag">{BUSINESS.tagline.toUpperCase()}</span>
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {BUSINESS.phoneTel && <a href={`tel:${BUSINESS.phoneTel}`} data-cta="header_phone" className="hide-sm" style={{ textDecoration: 'none', fontWeight: 700, fontSize: 15, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>{BUSINESS.phoneDisplay}</a>}
          <a href="#quote" className="btn btn-red" data-cta="header_quote">Get my&nbsp;<span className="xs-hide">free&nbsp;</span>quote</a>
        </div>
      </header>

      <main>
        <section id="top" className="hero">
          <svg aria-hidden="true" viewBox="0 0 600 300" preserveAspectRatio="none" style={{ position: 'absolute', left: -60, top: -110, width: 'min(560px, max(0px, calc((100vw - 1240px) / 2 + 40px)))', height: 300, zIndex: 0 }}>
            <path d="M0 120 C120 40 220 200 360 110 C460 50 520 80 600 40 V0 H0 Z" fill="#1F3B83" />
            <path d="M0 180 C140 90 240 240 380 150 C470 95 540 120 600 90 V60 C520 100 460 70 360 130 C220 220 120 60 0 140 Z" fill="#0392C6" />
            <path d="M0 200 C150 110 250 260 390 170" fill="none" stroke="#121316" strokeWidth="3" strokeDasharray="10 8" />
          </svg>
          <svg aria-hidden="true" viewBox="0 0 600 300" preserveAspectRatio="none" style={{ position: 'absolute', right: -80, bottom: -40, width: 620, height: 300, zIndex: 0 }}>
            <path d="M600 140 C480 220 380 60 240 150 C140 210 70 180 0 260 V300 H600 Z" fill="#1F3B83" />
            <path d="M600 200 C470 270 380 130 250 210 C160 265 90 240 20 300 H600 Z" fill="#0392C6" />
            <path d="M600 120 C480 200 380 40 240 130" fill="none" stroke="#121316" strokeWidth="3" strokeDasharray="10 8" />
          </svg>
          <div className="hero-grid wrap">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <span className="badge-dashed"><span className="i3 s28 i-check" aria-hidden="true" />Custom 3D PVC patches</span>
              <h1 className="hd">
                <span style={{ color: 'var(--navy)' }}>Premium Custom</span>
                <span style={{ color: 'var(--teal)' }}>Patches For</span>
                <span style={{ color: 'var(--red)' }}>Your Brand</span>
              </h1>
              <HeroQuiz types={quizTypes} id="hq-m" className="hq-mobile" />
              <p className="hero-lead">Send your logo or idea and see a free mockup in 24 hours. Our design team turns it into a durable, premium patch. Free shipping and no minimum order, backed by our money back guarantee.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="#quote" className="btn cta-main" data-cta="hero_quote">Get my free quote<Arrow /></a>
                <UploadCta />
              </div>
              <div className="promise-card">
                {['Free mockup in 24 hours', 'No minimum order', 'Money back guarantee'].map((t) => (
                  <span key={t}><span className="i3 s28 i-check" aria-hidden="true" />{t}</span>
                ))}
              </div>
            </div>
            <HeroQuiz types={quizTypes} id="hq-d" className="hq-desktop" />
          </div>
        </section>

        <section style={{ padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <div className="fees hd">
            <span>FREE MOCKUP</span>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="#0392C6" /></svg>
            <span>FREE SHIPPING</span>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="#0392C6" /></svg>
            <span>NO MINIMUM</span>
          </div>
        </section>

        <section className="reel" style={{ padding: '64px 24px 8px' }}>
          <div className="wrap reel-grid">
            <div className="reel-copy">
              <span className="eyebrow">Why Future PVC Patch</span>
              <h2 className="hd h2">Design It, Patch It And Promote</h2>
              <p className="sub">We produce top quality products on custom demand: 3D PVC patches, key chains, stickers, t-shirts and hoodies. Simply give us your concept and our talented design team brings it to life. You see a free mockup within 24 hours, and shipping is free.</p>
              <div className="dg-stats">
                {WHY.map(([n, t]) => (
                  <div key={n}><strong className="hd">{n}</strong><span>{t}</span></div>
                ))}
              </div>
              <a href="#quote" className="btn cta-main" data-cta="why_quote" style={{ alignSelf: 'flex-start' }}>Get my free quote<Arrow /></a>
            </div>
            <div className="reel-frame why-photo">
              <img src={withBase('/assets/art/hero-flatlay.webp')} alt="Custom patches laid out on a table" width={1080} height={1080} loading="lazy" decoding="async" />
            </div>
          </div>
        </section>

        <section style={{ padding: '56px 24px 24px' }}>
          <div className="wrap" style={{ marginBottom: 28, textAlign: 'center' }}>
            <h2 className="hd h2">Everything Included. Zero Risk.</h2>
            <p className="sub" style={{ maxWidth: 620 }}>Free mockup in 24 hours, free shipping and no minimum order, backed by our money back guarantee.</p>
          </div>
          <div className="wrap trust-grid">
            {INCLUDED.map(([icon, title, text]) => (
              <div className="trust-card" key={title}>
                <span className={`i3 s64 ${icon}`} aria-hidden="true" />
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <CtaRow id="included_quote" />
        </section>

        <section style={{ padding: '56px 24px' }}>
          <div className="wrap">
            <h2 className="hd h2">Pick Your Product</h2>
            <p className="sub" style={{ maxWidth: 560, marginBottom: 32 }}>Not sure which style fits? Choose Not sure in the quote form and our team will recommend the best option.</p>
            <div className="types-grid">
              {['pvc', 'key', 'stk'].map((k) => {
                const t = bySlug[k];
                return (
                  <div className="type-card" key={k}>
                    <img src={t.img} alt={t.label} width={112} height={112} loading="lazy" style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <strong className="hd">{t.label}</strong>
                      <span style={{ fontSize: 15, color: 'var(--muted)' }}>{t.desc}</span>
                      <PickTypeLink type={t.label} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: '8px 24px 56px' }}>
          <div className="wrap">
            <span className="eyebrow">Our promise</span>
            <h2 className="hd h2">No Surprises When Your Patches Arrive</h2>
            <p className="sub" style={{ maxWidth: 600, marginBottom: 28 }}>You see it, you check it, you approve it. Then we make it, and our money back guarantee covers the rest.</p>
            <div className="promise-grid">
              {PROMISES.map(([icon, title, text]) => (
                <div className="promise-tile" key={title}>
                  <span className={`i3 s56 ${icon}`} aria-hidden="true" />
                  <strong className="hd">{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="made" style={{ padding: '8px 24px 64px' }}>
          <div className="wrap">
            <span className="eyebrow">Made for</span>
            <h2 className="hd h2">Brands, Teams And Personal Projects</h2>
            <p className="sub" style={{ maxWidth: 560, marginBottom: 28 }}>From sports teams to motorcycle clubs and new apparel brands, we make patches that help you promote.</p>
            <div className="made-grid">
              {MADE_FOR.map((m) => (
                <figure className="made-tile" key={m.label}>
                  <img src={m.img} alt={m.alt} width={720} height={1080} loading="lazy" decoding="async" />
                  <figcaption>{m.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '24px 24px 56px' }}>
          <div className="wrap">
            <h2 className="hd h2" style={{ marginBottom: 28 }}>How It Works</h2>
            <ol className="steps-grid">
              {STEPS.map((s, i) => (
                <li className="step-card" key={s.title} style={{ ['--accent' as string]: s.accent }}>
                  <span className="n hd" aria-hidden="true">{i + 1}</span>
                  <img className="step-art" src={s.img} alt="" width={180} height={180} loading="lazy" decoding="async" />
                  <strong>{s.title}</strong>
                  <span className="d">{s.text}</span>
                </li>
              ))}
            </ol>
            <CtaRow id="how_quote" label="Start my free quote" />
          </div>
        </section>

        <section id="quote" className="quote bgpd">
          <ViewContentObserver />
          <div className="wrap">
            <h2 className="hd h2" style={{ color: '#fff' }}>Get Your Free Quote</h2>
            <p className="sub" style={{ color: '#CFCFCA', maxWidth: 560, marginBottom: 30 }}>Seven quick steps. Takes about a minute. We reply on WhatsApp with your price and free mockup.</p>
            <QuoteForm />
          </div>
        </section>

        <section style={{ padding: '56px 24px' }}>
          <div className="wrap local">
            <img className="local-photo" src={withBase('/assets/art/heat-press.webp')} alt="A custom patch being applied to a denim jacket" width={960} height={536} loading="lazy" decoding="async" />
            <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--red)', padding: '5px 12px', borderRadius: 999 }}>Clear communication</span>
              <h2 className="hd" style={{ margin: 0, fontSize: 'clamp(28px, 3.2vw, 40px)', lineHeight: 1.08 }}>Talk To Our Team, Start To Finish</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: 'var(--muted)' }}>Message us on WhatsApp or email and talk to a real person who knows patches and knows your order, from your first idea to delivery.</p>
            </div>
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BUSINESS.phoneTel && <a href={`tel:${BUSINESS.phoneTel}`} className="contact-row" data-cta="local_phone"><span className="i3 s44 i-phone" aria-hidden="true" />Call or text {BUSINESS.phoneDisplay || BUSINESS.phoneTel}</a>}
              {BUSINESS.email && <a href={`mailto:${BUSINESS.email}`} className="contact-row"><span className="i3 s44 i-mail" aria-hidden="true" />{BUSINESS.email}</a>}
              <a href={BUSINESS.website} target="_blank" rel="noopener" className="contact-row" data-cta="local_website"><span className="i3 s44 i-pin" aria-hidden="true" />Visit {BUSINESS.websiteLabel}</a>
              {BUSINESS.address && <span className="contact-row"><span className="i3 s44 i-pin" aria-hidden="true" />{BUSINESS.address}</span>}
              <a href="#quote" className="contact-row" data-cta="local_quote"><span className="i3 s44 i-clock" aria-hidden="true" />Start your free quote, it takes a minute</a>
            </div>
          </div>
        </section>

        <section style={{ padding: '8px 24px 64px' }}>
          <div className="wrap">
            <span className="eyebrow">Our happy clients</span>
            <h2 className="hd h2">What Our Customers Say</h2>
            <p className="sub" style={{ maxWidth: 600, marginBottom: 28 }}>Smart, trendy patches that are high quality and long lasting, for businesses, teams and clubs.</p>
            <div className="review-grid">
              {REVIEWS.map((r) => (
                <figure className="review-card" key={r.name}>
                  <span className="review-mark hd" aria-hidden="true">&ldquo;</span>
                  <blockquote>{r.text}</blockquote>
                  <figcaption>{r.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '0 24px 64px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <h2 className="hd h2" style={{ marginBottom: 24 }}>Questions, Answered</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FAQ.map(([q, a]) => (
                <details className="faq" key={q}>
                  <summary>{q}<span className="plus" aria-hidden="true">+</span></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '0 24px 64px' }}>
          <div className="wrap final">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
              <h2 className="hd" style={{ margin: 0, fontSize: 'clamp(28px, 3.6vw, 44px)', lineHeight: 1.05, color: '#fff' }}>Get Your Free Mockup Within 24 Hours</h2>
              <p style={{ margin: 0, fontSize: 17, color: '#DCEEFA' }}>Free mockup in 24 hours, free shipping, no minimum order and a money back guarantee.</p>
            </div>
            <a href="#quote" className="btn cta-main" data-cta="final_quote">Get my free quote<Arrow /></a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src={withBase('/assets/logo-160.webp')} alt={`${BUSINESS.name} logo`} width={56} height={56} style={{ borderRadius: 12 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong className="hd" style={{ color: '#fff' }}>{BUSINESS.nameUpper}</strong>
              <span style={{ fontSize: 13 }}>{BUSINESS.address || BUSINESS.tagline}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>
            {BUSINESS.phoneTel && <a href={`tel:${BUSINESS.phoneTel}`}>{BUSINESS.phoneDisplay}</a>}
            {BUSINESS.email && <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>}
            <a href={BUSINESS.website} target="_blank" rel="noopener">{BUSINESS.websiteLabel}</a>
            <a href={withBase('/privacy')}>Privacy Policy</a>
            <a href={withBase('/terms')}>Terms</a>
          </div>
        </div>
      </footer>

      <StickyCta />
      <FunnelTracker />
    </div>
  );
}
