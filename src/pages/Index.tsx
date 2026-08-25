import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Camera, Zap, Shield, Download, ChevronRight, Star, CheckCircle2, FileText, Layers } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const features = [
  { icon: Camera, title: "15+ Photo Specs", desc: "Pakistan Passport, CNIC, Army, Police, FIA, FPSC, US/UK/Canada Visa and more", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: Zap, title: "Instant Processing", desc: "100% browser-based processing using Canvas API — no server upload needed", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { icon: Layers, title: "Smart Adjustments", desc: "Brightness, contrast, saturation, crop, rotate — full control over your photo", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Shield, title: "100% Private", desc: "Your photos never leave your device. All processing happens locally", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: FileText, title: "PDF Print Sheet", desc: "Generate a printable sheet with 2, 4, 6, or 8 photos ready for cutting", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: Download, title: "JPG / PNG Export", desc: "Download in JPG or PNG format with auto-compressed file size", color: "text-blue-400", bg: "bg-blue-500/10" },
];

const specs = [
  { flag: "🇵🇰", name: "Pakistan Passport", size: "35×45mm" },
  { flag: "🪪", name: "CNIC Photo", size: "35×45mm" },
  { flag: "👮", name: "Punjab Police", size: "1.5×2 inch" },
  { flag: "🪖", name: "Pakistan Army", size: "35×45mm" },
  { flag: "🎓", name: "FPSC / CSS", size: "40×50mm" },
  { flag: "🇺🇸", name: "US Visa", size: "2×2 inch" },
  { flag: "🇬🇧", name: "UK Visa", size: "35×45mm" },
  { flag: "🇦🇪", name: "UAE Visa", size: "35×45mm" },
];

const steps = [
  { n: "01", title: "Upload Photo", desc: "Drag & drop, browse, or take a camera photo directly" },
  { n: "02", title: "Select Specification", desc: "Choose from 15+ government and international photo specs" },
  { n: "03", title: "Adjust & Perfect", desc: "Fine-tune brightness, contrast, crop, and rotation" },
  { n: "04", title: "Download or Print", desc: "Save as JPG/PNG or print a full PDF sheet" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-[#050d1a] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <img src={heroBanner} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050d1a]/60 via-[#050d1a]/50 to-[#050d1a]" />
        </div>
        {/* Glow orbs */}
        <div className="absolute top-24 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-8">
            <Star className="w-3.5 h-3.5 fill-cyan-400" />
            AI-Powered Photo Processing Tool
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            Professional
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500">
              Passport Photos
            </span>
            in Seconds
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create perfectly sized passport, CNIC, visa, and government photos for <strong className="text-white">Pakistan & 10+ countries</strong> — all processed privately in your browser.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/editor"
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold rounded-2xl shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300"
            >
              <Camera className="w-5 h-5" />
              Start Editing Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-8 py-4 border border-white/20 text-slate-300 text-lg font-semibold rounded-2xl hover:bg-white/5 hover:border-white/30 hover:text-white transition-all duration-300"
            >
              View Dashboard
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-4 justify-center">
            {["✅ No Registration", "🔒 100% Private", "⚡ Instant Results", "📄 PDF Export"].map((b) => (
              <span key={b} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Specs Marquee */}
      <section className="py-8 border-y border-white/5 bg-white/2 overflow-hidden">
        <div className="flex gap-6 animate-none">
          <div className="flex gap-6 flex-wrap justify-center px-6">
            {specs.map((s) => (
              <div key={s.name} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 flex-shrink-0">
                <span className="text-xl">{s.flag}</span>
                <div>
                  <p className="text-sm text-white font-medium">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Works</span>
            </h2>
            <p className="text-slate-400">Four simple steps to your perfect photo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-cyan-500/30 to-transparent z-0" />
                )}
                <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-cyan-500/30 hover:bg-white/8 transition-all duration-300 group">
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-500/40 to-blue-500/40 mb-4">
                    {step.n}
                  </div>
                  <h3 className="text-white font-bold mb-2 group-hover:text-cyan-300 transition-colors">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-white/2">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Everything You <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Need</span>
            </h2>
            <p className="text-slate-400">Professional tools, zero complexity</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/20 hover:bg-white/8 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-violet-500/10 p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to Create Your Photo?
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                No sign-up required. Start processing photos instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/editor"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Open Photo Editor
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {["Pakistan Passport", "CNIC", "Police Job", "Army", "FPSC/CSS", "US Visa"].map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-sm text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">AI Photo Studio Pro</span>
        </div>
        <p className="text-slate-600 text-sm">
          All photo processing happens in your browser. Your photos are never uploaded to any server.
        </p>
      </footer>
    </div>
  );
}
