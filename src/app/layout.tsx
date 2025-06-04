import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coder - AI Web IDE",
  description: "The most advanced mobile-first AI-powered web IDE in 2025. Code anywhere with cutting-edge touch interactions.",
  keywords: ["AI", "IDE", "mobile-first", "code editor", "web development", "PWA"],
  authors: [{ name: "Coder Team" }],
  creator: "Coder",
  publisher: "Coder",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Coder - AI Web IDE",
    description: "The most advanced mobile-first AI-powered web IDE in 2025",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coder - AI Web IDE", 
    description: "The most advanced mobile-first AI-powered web IDE in 2025",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="dark" />
        
        {/* PWA Specific Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Coder" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Coder" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120.png" />
        
        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-startup-image" href="/splash/launch-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/launch-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/launch-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/launch-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/launch-1284x2778.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Preconnect to external services */}
        <link rel="preconnect" href="https://text.pollinations.ai" />
        <link rel="preconnect" href="https://catbox.moe" />
        <link rel="preconnect" href="https://api.imgbb.com" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('SW registered: ', registration);
                  
                  // Check for updates
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New update available
                        if (confirm('A new version is available. Update now?')) {
                          newWorker.postMessage({ type: 'SKIP_WAITING' });
                          window.location.reload();
                        }
                      }
                    });
                  });
                }).catch(function(registrationError) {
                  console.log('SW registration failed: ', registrationError);
                });
              });
              
              // Listen for messages from SW
              navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'BACKGROUND_SYNC') {
                  console.log('Background sync completed');
                }
              });
            }
          `
        }} />
        
        {/* PWA Install Prompt Enhancement */}
        <script dangerouslySetInnerHTML={{
          __html: `
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
              console.log('PWA install prompt triggered');
              e.preventDefault();
              deferredPrompt = e;
              
              // Show custom install button after delay
              setTimeout(() => {
                const installBanner = document.createElement('div');
                installBanner.id = 'pwa-install-banner';
                installBanner.innerHTML = \`
                  <div style="position: fixed; bottom: 80px; left: 16px; right: 16px; z-index: 1000; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 16px; border-radius: 16px; box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3); backdrop-filter: blur(10px); display: flex; align-items: center; gap: 12px; animation: slideUp 0.3s ease;">
                    <div style="flex: 1;">
                      <div style="font-weight: 600; font-size: 14px;">Install Coder</div>
                      <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Get the full mobile experience</div>
                    </div>
                    <button onclick="installPWA()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s;">Install</button>
                    <button onclick="dismissInstall()" style="background: none; border: none; color: white; padding: 8px; cursor: pointer; opacity: 0.7; font-size: 18px;">×</button>
                  </div>
                  <style>
                    @keyframes slideUp {
                      from { transform: translateY(100%); opacity: 0; }
                      to { transform: translateY(0); opacity: 1; }
                    }
                  </style>
                \`;
                document.body.appendChild(installBanner);
                
                window.installPWA = async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const result = await deferredPrompt.userChoice;
                    console.log('PWA install result:', result);
                    deferredPrompt = null;
                    document.getElementById('pwa-install-banner')?.remove();
                  }
                };
                
                window.dismissInstall = () => {
                  document.getElementById('pwa-install-banner')?.remove();
                  localStorage.setItem('pwa-install-dismissed', Date.now());
                };
                
              }, 3000);
            });
            
            window.addEventListener('appinstalled', (evt) => {
              console.log('PWA was installed');
              document.getElementById('pwa-install-banner')?.remove();
            });
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white overflow-hidden touch-pan-y`}
      >
        {children}
      </body>
    </html>
  );
}
