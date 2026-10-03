'use client';

import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-layout">
      <Suspense fallback={<aside className="sidebar" style={{ width: 260 }} />}>
        <Sidebar />
      </Suspense>
      <div className="main-content">
        <Header />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
