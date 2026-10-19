// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';

export default function RootPage() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [token, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-16 animate-soft-pulse drop-shadow-md">
          <Image
            src="/logo.png"
            alt="Refrigerator Logo"
            fill
            sizes="64px"
            className="object-contain"
            priority
          />
        </div>
        <p className="text-xs font-bold text-[#786665] tracking-wide uppercase">
          Loading Super Admin...
        </p>
      </div>
    </div>
  );
}
