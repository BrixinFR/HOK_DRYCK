import Link from "next/link";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await stackServerApp.getUser();
  if (user) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Full page background */}
      <div className="fixed inset-0 bg-linear-to-br from-gray-900 via-gray-800 to-black -z-20"></div>
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#de3163] rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 min-h-screen flex flex-col">
        {/* Logo at top */}
        <div className="pt-8 flex justify-center animate-fade-in">
          <img
            src="/NollK-Ser-Dig.png"
            alt="NollK Ser Dig Logo"
            className="max-w-75 h-auto rounded-lg shadow-2xl opacity-70"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(222, 49, 99, 0.5))'
            }}
          />
        </div>

        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto w-full">
            {/* Title */}
            <div className="mb-8 animate-fade-in">
              <h1 className="text-7xl font-black tracking-wider mb-4" 
                  style={{ 
                    background: 'linear-gradient(135deg, #de3163 0%, #ff6b9d 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 60px rgba(222, 49, 99, 0.5)'
                  }}>
                NOLLK SER DIG
              </h1>
              <div className="h-1 w-32 bg-linear-to-r from-transparent via-[#de3163] to-transparent mx-auto"></div>
            </div>

            {/* Tagline */}
            <p className="text-2xl text-gray-300 mb-4 font-light animate-fade-in-delay-1">
              HØK DRYCKESSYSTEM
            </p>
            <p className="text-lg text-gray-400 mb-2 max-w-2xl mx-auto animate-fade-in-delay-2">
              Access via din system kod.
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in-delay-2">
              Skapat av KENZO HØK'25
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center animate-fade-in-delay-3">
              <Link
                href="/sign-in"
                className="group relative bg-linear-to-r from-[#de3163] to-[#ff6b9d] text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#de3163]/50 transition-all hover:scale-105"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all"></div>
              </Link>
              <Link
                href="#about"
                className="bg-white/10 backdrop-blur-sm text-white px-10 py-4 rounded-full font-bold text-lg border-2 border-white/20 hover:bg-white/20 hover:border-[#de3163]/50 transition-all hover:scale-105"
              >
                Learn More
              </Link>
            </div>

            {/* Footer tagline */}
            <div className="mt-16 animate-fade-in-delay-4">
              <p className="text-gray-500 text-sm italic">
                Droopy säger: "Ta en bärs, men swisha för fan"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}