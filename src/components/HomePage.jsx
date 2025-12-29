import { useEffect, useMemo, useRef, useState } from 'react';
import { AuthComponent } from './AuthComponent';
import { Layout } from './Layout';
import { Button } from '../ui/Button';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  TrendingUp,
  Wand2,
  Zap,
  Sparkles,
} from 'lucide-react';

function ImagePlaceholder({ label, aspectClassName = 'aspect-[16/10]', className = '' }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative ${aspectClassName} w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-highlight/25 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-primary-bg/50 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
          <Sparkles className="h-4 w-4 text-highlight" />
          Image placeholder
        </div>
        <div className="max-w-md px-6">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs text-white/60">Replace with your generated asset (PNG/JPG/SVG)</p>
        </div>
      </div>
    </div>
  );
}

export function HomePage({ user }) {
  const adFormats = useMemo(
    () => [
      {
        key: 'display',
        label: 'Display',
        src: 'https://newslatch.com/ad-formats/display.png',
      },
      {
        key: 'social',
        label: 'Social',
        src: 'https://newslatch.com/ad-formats/social.png',
      },
      {
        key: 'adwords',
        label: 'AdWord',
        src: 'https://newslatch.com/ad-formats/adwords.png',
      },
      {
        key: 'banner',
        label: 'Banner',
        src: 'https://newslatch.com/ad-formats/banner.png',
      },
    ],
    []
  );

  const [activeAdFormatKey, setActiveAdFormatKey] = useState(adFormats[0]?.key ?? 'display');
  const [adImageLoading, setAdImageLoading] = useState(true);

  const galleryImages = useMemo(
    () => [
      'https://newslatch.com/4NewslatchStories.png',
      'https://newslatch.com/1NewslatchStories.png',
      'https://newslatch.com/2NewslatchStories.png',
      'https://newslatch.com/8NewslatchStories.png',
      'https://newslatch.com/5NewslatchStories.png',
      'https://newslatch.com/3NewslatchStories.png',
      'https://newslatch.com/6NewslatchStories.png',
      'https://newslatch.com/7NewslatchStories.png',
    ],
    []
  );

  const galleryRef = useRef(null);

  const scrollGalleryBy = (direction) => {
    const el = galleryRef.current;
    if (!el) return;
    const amount = Math.max(320, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  const activeAdFormatIndex = Math.max(
    0,
    adFormats.findIndex((f) => f.key === activeAdFormatKey)
  );
  const activeAdFormat = adFormats[activeAdFormatIndex] ?? adFormats[0];

  useEffect(() => {
    setAdImageLoading(true);
  }, [activeAdFormatKey]);

  return (
    <Layout user={user}>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-highlight/20 blur-3xl" />
          <div className="absolute top-24 right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-[-220px] left-[-180px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-14 sm:pt-20 sm:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-8 inline-flex items-center justify-center rounded-3xl border border-white/10 bg-card-bg/60 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur">
              <img src="/icon.png" alt="NewsLatch Icon" className="h-12 w-12" />
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              NewsLatch Studio
            </h1>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              AI turns headlines into higher conversions
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-paragraph">
              Find stories your audience already cares about, generate campaign angles, and embed a widget that turns
              attention into leads.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <AuthComponent user={user} />
              <Button asChild variant="outline" className="px-6 py-3">
                <a href="#video">
                  Watch demo
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-5xl">
            <div className="relative rounded-3xl border border-white/10 bg-card-bg/40 shadow-[0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-sm">
              <div aria-hidden="true" className="pointer-events-none absolute -inset-8 opacity-90">
                <div className="absolute -top-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-highlight/20 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
              </div>

              {/* subtle interconnected lines */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
                viewBox="0 0 1000 600"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="nlHeroLine" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="rgba(0,230,208,0.0)" />
                    <stop offset="0.35" stopColor="rgba(0,230,208,0.28)" />
                    <stop offset="0.7" stopColor="rgba(255,255,255,0.12)" />
                    <stop offset="1" stopColor="rgba(255,255,255,0.0)" />
                  </linearGradient>
                </defs>
                <path d="M40,470 C210,380 310,420 440,300 C560,190 690,220 830,140" stroke="url(#nlHeroLine)" strokeWidth="2" fill="none" />
                <path d="M120,520 C260,470 380,500 520,380 C650,270 760,300 920,210" stroke="url(#nlHeroLine)" strokeWidth="2" fill="none" />
                <path d="M80,220 C220,260 300,200 420,220 C560,250 660,160 820,170" stroke="url(#nlHeroLine)" strokeWidth="2" fill="none" />
                {[
                  [140, 520],
                  [240, 420],
                  [420, 300],
                  [520, 380],
                  [690, 220],
                  [830, 140],
                  [920, 210],
                  [120, 220],
                  [420, 220],
                  [820, 170],
                ].map(([cx, cy], i) => (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="6" fill="rgba(0,230,208,0.12)" />
                    <circle cx={cx} cy={cy} r="2" fill="rgba(0,230,208,0.55)" />
                  </g>
                ))}
              </svg>

              <div className="relative overflow-hidden rounded-3xl p-3 sm:p-5">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-primary-bg/30">
                  <img
                    className="w-full h-auto object-contain"
                    src="https://emvwmwdsaakdnweyhmki.supabase.co/storage/v1/object/public/public-files/newslatch/hero.png"
                    alt="NewsLatch Studio dashboard preview"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY CAROUSEL */}
      <section className="border-y border-white/5 bg-primary-bg/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Turn Headlines into High-Performance Ads
            </h2>
            <p className="mt-4 text-lg text-text-paragraph">
              See how brands are turning today&apos;s headlines into high-performing ad campaigns with Newslatch
            </p>
          </div>

          <div className="relative mt-10">
            {/* Edge fades */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-primary-bg/90 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-primary-bg/90 to-transparent" />

            {/* Controls */}
            <div className="absolute right-0 top-[-52px] flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Previous gallery"
                onClick={() => scrollGalleryBy(-1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Next gallery"
                onClick={() => scrollGalleryBy(1)}
              >
                <ChevronRight />
              </Button>
            </div>

            {/* Scroll area */}
            <div
              ref={galleryRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {galleryImages.map((src, idx) => (
                <div
                  key={src}
                  className="snap-start shrink-0"
                  style={{ width: 'min(520px, 86vw)' }}
                >
                  <div className="aspect-[5/4] overflow-hidden rounded-3xl border border-white/10 bg-card-bg/40 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                    <img
                      src={src}
                      alt={`NewsLatch story example ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-white/50">Swipe or use arrows to browse.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">How it works</h2>
          <p className="mt-4 text-lg text-text-paragraph">
            From headline discovery to an embeddable widget in minutes.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl space-y-4">
          {[
            {
              n: '1',
              title: 'Paste Your URL, We Handle the Rest',
              desc: 'We instantly analyze your public site to understand your tone, offer, and positioning.',
              icon: Wand2,
            },
            {
              n: '2',
              title: 'AI Finds What\'s Driving Demand',
              desc: 'Our engine scans live, brand-safe news and social trends, matching your product to the headlines that move your audience.',
              icon: Sparkles,
            },
            {
              n: '3',
              title: 'Instant Ad Assets, Ready for Review',
              desc: 'Every day, get new, on-brand ad variants including copy, visuals, and CTAs pre-built for performance. Approve, edit, or skip with one click.',
              icon: Zap,
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-card-bg/70 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-button-text font-extrabold">
                    {step.n}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Icon className="h-5 w-5 text-highlight" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-text-paragraph">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AD FORMATS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Instantly Generated Ads for Every Format
          </h2>
          <p className="mt-4 text-lg text-text-paragraph">
            Ready-to-run ad creatives for any platform in seconds based on breaking news
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card-bg/60 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-highlight/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-highlight/10 blur-3xl" />

            <div className="grid gap-0 lg:grid-cols-2">
              {/* Left: copy + toggle */}
              <div className="p-8">
                <h3 className="text-xl font-bold text-white">Generate creatives that match the moment</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-paragraph">
                  NewsLatch turns live headlines into platform-ready ads with consistent messaging across formats.
                </p>

                <div className="mt-6 space-y-5">
                  {[
                    {
                      title: 'Automatically Generate Relevant Ads',
                      desc: 'Connect your brand to live events and trends your audience cares about the moment they happen.',
                    },
                    {
                      title: 'Proven to Double CTR',
                      desc: 'Live-event-aligned creative proven to increase CTRs 2× or more through real-time relevance.',
                    },
                    {
                      title: 'Launch-Ready in 60 Seconds',
                      desc: 'Get new, on-brand ad variants including copy, visuals, and CTAs pre-built for performance daily.',
                    },
                    {
                      title: 'Higher ROAS Without Extra Spend',
                      desc: 'Real-time creative beats guesswork every time. Stay relevant without additional ad spend.',
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-highlight/15">
                        <Check className="h-4 w-4 text-highlight" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-text-paragraph">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Right: preview */}
              <div className="border-t border-white/10 bg-primary-bg/30 p-6 lg:border-t-0 lg:border-l">
                <div>
                  <div
                    role="tablist"
                    aria-label="Ad format"
                    className="relative mx-auto grid w-full max-w-[420px] grid-cols-4 items-center rounded-full border border-white/10 bg-white/5 p-1 sm:w-[80%]"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-1 left-1 w-[calc(25%-0.125rem)] rounded-full bg-highlight shadow-[0_10px_28px_rgba(0,0,0,0.25)] transition-transform duration-200"
                      style={{ transform: `translateX(${activeAdFormatIndex * 100}%)` }}
                    />

                    {adFormats.map((f, idx) => {
                      const isActive = idx === activeAdFormatIndex;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          tabIndex={isActive ? 0 : -1}
                          onClick={() => setActiveAdFormatKey(f.key)}
                          className={`relative z-10 inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-primary-bg ${
                            isActive ? 'text-button-text' : 'text-white/70 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-white/50">
                    Tip: swap formats to keep the same angle consistent across placements.
                  </p>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-primary-bg/50">
                  <div className="relative">
                    {adImageLoading && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/10 to-white/5"
                      />
                    )}
                    <img
                      key={activeAdFormatKey}
                      src={activeAdFormat?.src}
                      alt={`${activeAdFormat?.label ?? 'Ad'} format preview`}
                      className={`w-full transition-opacity duration-200 ${adImageLoading ? 'opacity-0' : 'opacity-100'}`}
                      loading="eager"
                      onLoad={() => setAdImageLoading(false)}
                      onError={() => setAdImageLoading(false)}
                    />
                  </div>
                </div>

                {/* Preload other format images for instant switching */}
                <div className="hidden" aria-hidden="true">
                  {adFormats
                    .filter((f) => f.key !== activeAdFormatKey)
                    .map((f) => (
                      <img key={f.key} src={f.src} alt="" loading="eager" />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO */}
      <section id="video" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">See it in action</h2>
            <p className="mt-4 text-lg text-text-paragraph">A quick walkthrough of NewsLatch Studio.</p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <video
                className="aspect-video w-full"
                src="https://emvwmwdsaakdnweyhmki.supabase.co/storage/v1/object/public/public-files/newslatch/newslatch.mp4"
                controls
                playsInline
                preload="metadata"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        

        <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-b from-card-bg/80 to-primary-bg/80 p-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <h2 className="text-3xl font-extrabold text-white">Start converting headlines today</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-paragraph">
            Sign in and generate your first campaign angles in minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <AuthComponent user={user} />
          </div>
        </div>
      </section>
    </Layout>
  );
}