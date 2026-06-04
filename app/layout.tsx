import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css'; 
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ofofo.ng | Premium African Digital Publishing & News Platform',
  description: 'Ofofo.ng is West Africa’s premium media platform covering business, technology, politics, culture, and educational breakthroughs with uncompromised journalistic integrity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} scroll-smooth h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Squelch and suppress any uncaught TypeError associated with "ethereum" or "redefine property"
                window.addEventListener('error', function(e) {
                  if (e.message && (e.message.indexOf('ethereum') !== -1 || e.message.indexOf('redefine property') !== -1)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message && (e.reason.message.indexOf('ethereum') !== -1 || e.reason.message.indexOf('redefine property') !== -1)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);

                // Pre-emptively configure window.ethereum with a configurable getter/setter to prevent write blockages
                try {
                  var _ethStore = undefined;
                  Object.defineProperty(window, 'ethereum', {
                    get: function() { return _ethStore; },
                    set: function(val) { _ethStore = val; },
                    configurable: true,
                    enumerable: true
                  });
                } catch (err) {
                  // Ignore define errors as they are handled by error listener
                }
              })();
            `
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[#050505] text-slate-100 selection:bg-[#d41c1c] selection:text-white h-full" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

