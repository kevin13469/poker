'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="container mx-auto flex-1 grid md:grid-cols-[280px_1fr] gap-8 px-4 py-8 md:py-12">
        <aside className="hidden md:block w-full border-r border-border pr-6">
          <SidebarNav />
        </aside>
        <main className="w-full min-w-0">
          <ScrollArea className="h-[calc(100vh-10rem)] pr-2"> {/* Adjust height based on header/footer */}
            {children}
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
