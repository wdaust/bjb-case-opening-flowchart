import { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import { Phone, Scale, Shield, Heart, Clock, Award, ChevronRight, Star, MapPin, ArrowRight, ChevronDown, Users, DollarSign, Building, Quote } from 'lucide-react';

// ── Intersection Observer hook for scroll animations ──────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Animated counter ──────────────────────────────────────────────
function Counter({ end, prefix = '', suffix = '', duration = 2000 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, end, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ── Section wrapper with fade-in ──────────────────────────────────
function FadeSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={cn('transition-all duration-1000 ease-out', inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Practice area data ────────────────────────────────────────────
const practiceAreas = [
  { icon: '🚗', title: 'Car Accidents', desc: 'Aggressive representation for all motor vehicle collision cases across NJ, NY, CT, and beyond.' },
  { icon: '🚛', title: 'Truck Accidents', desc: 'Complex commercial trucking cases requiring expert investigation and maximum recovery.' },
  { icon: '⚠️', title: 'Slip & Fall', desc: 'Premises liability claims for injuries caused by dangerous property conditions.' },
  { icon: '🏗️', title: 'Construction Injuries', desc: 'Workplace accidents on construction sites involving falls, equipment failures, and more.' },
  { icon: '🏥', title: 'Workers Compensation', desc: 'Securing benefits and compensation for on-the-job injuries and occupational illness.' },
  { icon: '🐕', title: 'Dog Bites', desc: 'Animal attack claims with compassionate advocacy for victims and their families.' },
  { icon: '🏍️', title: 'Motorcycle Accidents', desc: 'Dedicated motorcycle accident attorneys fighting bias and maximizing recovery.' },
  { icon: '⚖️', title: 'Employment Law', desc: 'Workplace discrimination, harassment, and wrongful termination representation.' },
];

const caseResults = [
  { amount: '$44M', type: 'Brain Injury', desc: 'Construction worker — debris chute fell causing TBI' },
  { amount: '$20M', type: 'Truck Accident', desc: 'Structured settlement for TBI to 23-year-old' },
  { amount: '$18M', type: 'Truck Accident', desc: 'Fatal rear-end collision by commercial truck' },
  { amount: '$12M', type: 'Trucking Accident', desc: 'Jury verdict — container crushed driver' },
  { amount: '$9M', type: 'Slip & Fall', desc: 'NYC Transit platform injury' },
  { amount: '$4.5M', type: 'Workplace Injury', desc: 'Toxic fume exposure — silicosis diagnosis' },
];

const testimonials = [
  { name: 'George', text: 'Insurance offered $10k. Brandon won $90k. Needless to say, I was thrilled with the result.', stars: 5 },
  { name: 'Tricia C.', text: 'WOW! This law firm helped me on two accident cases. The team heard my case and made me feel welcomed. They did fight for me.', stars: 5 },
  { name: 'Casey C.', text: 'Brandon got me way more for my settlement than my prior attorney was getting! They keep you updated every 30 days.', stars: 5 },
  { name: 'Jeff', text: 'You\'re an example of what lawyers could and should be. Responsive, settled for maximum allowable.', stars: 5 },
  { name: 'Cristina', text: 'Brandon really pushed for what I deserved. I was able to call Brandon anytime. He is definitely a negotiator.', stars: 5 },
  { name: 'Victor', text: 'The most comforting part of the whole process was communication not only with his office but Brandon himself.', stars: 5 },
];

const offices = [
  { city: 'River Edge', state: 'NJ', address: '65 East Route 4' },
  { city: 'Jersey City', state: 'NJ', address: '840 Bergen Ave, 2nd Flr' },
  { city: 'Cherry Hill', state: 'NJ', address: '404 Marlton Pike East' },
  { city: 'Trenton', state: 'NJ', address: '1331 Chambers St' },
  { city: 'New York', state: 'NY', address: '11 Broadway, Suite 615' },
  { city: 'Bridgeport', state: 'CT', address: '2320 Main St, Suite 2B' },
  { city: 'Toms River', state: 'NJ', address: '25 Main St, Ste C' },
  { city: 'Ewing', state: 'NJ', address: '850 Bear Tavern Rd, Ste 106' },
  { city: 'Paterson', state: 'NJ', address: '847 Main St' },
];

const faqs = [
  { q: 'How do I know if I have a case?', a: 'If you or a loved one has been injured due to someone else\'s negligence, you may have a valid claim. Contact us for a free case evaluation — we\'ll assess the circumstances and advise on your best options.' },
  { q: 'How long do I have to file a claim?', a: 'In New Jersey, the statute of limitations for personal injury claims is generally 2 years from the date of the accident. Other states may differ. Don\'t wait — contact us early to preserve your rights.' },
  { q: 'How much does it cost to hire a personal injury attorney?', a: 'We work on a contingency fee basis — you pay nothing upfront and nothing unless we win your case. Our fee is a percentage of the settlement or verdict we recover for you.' },
  { q: 'What types of compensation can I recover?', a: 'You may be entitled to medical expenses, lost wages, pain and suffering, loss of quality of life, and future medical needs. Each case is unique, and we fight for maximum compensation.' },
  { q: 'Will my case go to trial?', a: 'The majority of personal injury cases settle out of court. However, we prepare every case as if it will go to trial, which strengthens our negotiating position and often leads to higher settlements.' },
];

// ── Testimonial carousel ──────────────────────────────────────────
function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className={cn(
              'transition-all duration-700 ease-in-out',
              i === active ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none',
            )}
          >
            <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl p-10 md:p-14 backdrop-blur-sm">
              <Quote className="w-12 h-12 text-amber-500/40 mb-6" />
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-light italic mb-8">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-white font-semibold">{t.name}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === active ? 'w-8 bg-amber-500' : 'w-2 bg-white/20 hover:bg-white/40',
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-lg text-white font-medium pr-8 group-hover:text-amber-400 transition-colors">{q}</span>
        <ChevronDown className={cn('w-5 h-5 text-amber-500 transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-500', open ? 'max-h-96 pb-6' : 'max-h-0')}>
        <p className="text-white/60 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function BJBShowcase() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', category: '', message: '' });

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Full viewport cinematic
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[120px]" />

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-full px-5 py-2.5 mb-8 animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium tracking-[0.15em] text-amber-400/90 uppercase">Never Settle For Less</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <span className="block text-white">Our First</span>
            <span className="block text-white">Conversation</span>
            <span className="block bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">Starts With Empathy</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
            We all need a little help. Sometimes we need a lot.
            Brandon J. Broderick is here for you — 24/7.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
            <a href="#contact" className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold px-8 py-4 rounded-full text-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]">
              Free Consultation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="tel:8776587040" className="inline-flex items-center gap-3 text-white/70 hover:text-white font-medium px-8 py-4 rounded-full border border-white/10 hover:border-white/30 transition-all duration-300">
              <Phone className="w-5 h-5" />
              (877) 658-7040
            </a>
          </div>

          {/* $44.5M banner */}
          <div className="mt-16 animate-fade-in-up opacity-0" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-6 py-3">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-white/50">$44.5 Million Settlement — Our latest landmark result</span>
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STATS BAR — Animated counters
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-y border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] via-transparent to-amber-500/[0.02]" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: 500, prefix: '$', suffix: 'M+', label: 'Won for Clients', icon: DollarSign },
              { value: 200, suffix: '+', label: 'Years Combined Experience', icon: Clock },
              { value: 40, suffix: '+', label: 'Office Locations', icon: Building },
              { value: 9, suffix: '', label: 'States Served', icon: MapPin },
            ].map((stat, i) => (
              <FadeSection key={i} delay={i * 100}>
                <div className="text-center group">
                  <stat.icon className="w-6 h-6 text-amber-500/60 mx-auto mb-3" />
                  <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                    <Counter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-white/40 font-medium tracking-wide">{stat.label}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ABOUT — On Your Side
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeSection>
              <div>
                <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">About the Firm</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 leading-tight">
                  On Your Side.<br />
                  <span className="text-white/40">By Your Side.</span>
                </h2>
                <p className="text-white/50 leading-relaxed text-lg mb-6">
                  The aftermath of an accident can be confusing and uncertain. Brandon J. Broderick, Attorney at Law, is by your side — always advocating your best interest, so you can focus on healing.
                </p>
                <p className="text-white/50 leading-relaxed text-lg">
                  With decades of experience, our personal injury and car accident lawyers prioritize client care, compassion, and communication. We are your trusted partner throughout the process.
                </p>
              </div>
            </FadeSection>
            <FadeSection delay={200}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Heart, title: 'Client First', desc: 'Compassion drives every interaction' },
                  { icon: Shield, title: 'Proven Results', desc: '$500M+ in settlements & verdicts' },
                  { icon: Scale, title: 'Expert Advocacy', desc: 'We fight when others won\'t' },
                  { icon: Users, title: 'Your Team', desc: '24/7 support and communication' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-amber-500/30 hover:bg-amber-500/[0.03] transition-all duration-500"
                  >
                    <item.icon className="w-8 h-8 text-amber-500/70 mb-4 group-hover:text-amber-400 transition-colors" />
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CASE RESULTS — Dramatic showcase
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <FadeSection>
            <div className="text-center mb-16">
              <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">Case Results</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">
                Results That <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Speak Volumes</span>
              </h2>
              <p className="text-white/40 text-lg max-w-2xl mx-auto">
                A proven track record of securing life-changing outcomes for our clients.*
              </p>
            </div>
          </FadeSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {caseResults.map((result, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-amber-500/20 transition-all duration-500 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full blur-3xl group-hover:bg-amber-500/[0.06] transition-all" />
                  <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-3">
                    {result.amount}
                  </p>
                  <p className="text-white font-semibold mb-2">{result.type}</p>
                  <p className="text-white/40 text-sm leading-relaxed">{result.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>

          <p className="text-center text-white/20 text-xs mt-8">*Results may vary depending upon your particular facts and legal circumstances.</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PRACTICE AREAS — Interactive grid
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-16">
              <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">Practice Areas</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">What We Do</h2>
              <p className="text-white/40 text-lg max-w-2xl mx-auto">
                Comprehensive legal representation across personal injury and employment law.
              </p>
            </div>
          </FadeSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {practiceAreas.map((area, i) => (
              <FadeSection key={i} delay={i * 60}>
                <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-amber-500/20 hover:bg-white/[0.04] transition-all duration-500 cursor-pointer h-full">
                  <div className="text-3xl mb-4">{area.icon}</div>
                  <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-amber-400 transition-colors">{area.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{area.desc}</p>
                  <ArrowRight className="w-4 h-4 text-amber-500 mt-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS — Carousel
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <FadeSection>
            <div className="text-center mb-12">
              <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">Testimonials</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4">What Our Clients Say</h2>
            </div>
          </FadeSection>
          <FadeSection delay={200}>
            <TestimonialCarousel />
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROMISE — Trust pillars
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-16">
              <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">Our Promise</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">Our Promise to You</h2>
              <p className="text-white/40 text-lg max-w-2xl mx-auto">
                Your experience will be free from legalese, hype, intimidation, or hassle.
              </p>
            </div>
          </FadeSection>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { label: 'No Intimidation', icon: '🛡️' },
              { label: 'No Runaround', icon: '🎯' },
              { label: 'No Legalese', icon: '📝' },
              { label: 'No Hype', icon: '✨' },
              { label: 'No Hassle', icon: '🤝' },
            ].map((item, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div className="text-center p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-green-500/20 hover:bg-green-500/[0.02] transition-all duration-500">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          OFFICES — Location grid
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.015] to-transparent" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <FadeSection>
            <div className="text-center mb-16">
              <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">Locations</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">40+ Offices Across 9 States</h2>
              <p className="text-white/40 text-lg max-w-2xl mx-auto">
                From New Jersey to New York, Connecticut, Florida, and beyond — we're wherever you need us.
              </p>
            </div>
          </FadeSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offices.map((office, i) => (
              <FadeSection key={i} delay={i * 60}>
                <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-amber-500/20 transition-all duration-300">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold">{office.city}, {office.state}</p>
                    <p className="text-white/40 text-sm">{office.address}</p>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FAQ — Accordion
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-3xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-12">
              <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">FAQ</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4">Common Questions</h2>
            </div>
          </FadeSection>
          <FadeSection delay={200}>
            <div>
              {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CONTACT FORM — Premium intake form
          ═══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <FadeSection>
            <div className="text-center mb-12">
              <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">Get Started</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">Free Consultation</h2>
              <p className="text-white/40 text-lg max-w-2xl mx-auto">
                Tell us about your case. No obligation, no pressure — just answers.
              </p>
            </div>
          </FadeSection>

          <FadeSection delay={200}>
            <form onSubmit={e => e.preventDefault()} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-white/60 mb-2 font-medium">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-white/60 mb-2 font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2 font-medium">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-white/60 mb-2 font-medium">Type of Injury</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all appearance-none"
                >
                  <option value="" className="bg-zinc-900">Select category...</option>
                  <option value="personal-injury" className="bg-zinc-900">Personal Injury</option>
                  <option value="car-accident" className="bg-zinc-900">Car Accident</option>
                  <option value="truck-accident" className="bg-zinc-900">Truck Accident</option>
                  <option value="workers-comp" className="bg-zinc-900">Workers Compensation</option>
                  <option value="slip-fall" className="bg-zinc-900">Slip &amp; Fall</option>
                  <option value="medical-malpractice" className="bg-zinc-900">Medical Malpractice</option>
                  <option value="employment-law" className="bg-zinc-900">Employment Law</option>
                  <option value="other" className="bg-zinc-900">Other</option>
                </select>
              </div>
              <div className="mb-8">
                <label className="block text-sm text-white/60 mb-2 font-medium">Tell Us About Your Case</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
                  placeholder="Briefly describe what happened..."
                />
              </div>
              <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold py-4 rounded-xl text-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                Request Free Consultation
              </button>
              <p className="text-center text-white/20 text-xs mt-4">
                Free. No obligation. Confidential.
              </p>
            </form>
          </FadeSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-bold mb-4">Brandon J. Broderick</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Personal Injury Attorney At Law. Devoted to helping injured individuals and their families move forward.
              </p>
              <a href="tel:8776587040" className="inline-flex items-center gap-2 text-amber-500 font-semibold mt-4 hover:text-amber-400 transition-colors">
                <Phone className="w-4 h-4" />
                (877) 658-7040
              </a>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li>Personal Injury</li>
                <li>Car Accidents</li>
                <li>Truck Accidents</li>
                <li>Workers Compensation</li>
                <li>Employment Law</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">States Served</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li>New Jersey</li>
                <li>New York</li>
                <li>Connecticut</li>
                <li>Florida</li>
                <li>Pennsylvania, Vermont, Ohio, Kentucky, Massachusetts</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-xs">
              Attorney Advertising. Prior Results Do Not Guarantee A Similar Outcome.
            </p>
            <p className="text-white/20 text-xs">
              © 2026 Brandon J. Broderick LLC
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
