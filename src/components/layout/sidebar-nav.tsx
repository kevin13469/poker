
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { LogIn, UserPlus, LogOutIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof Icons | React.ComponentType<any>;
  authRequired?: boolean;
  hideWhenAuthed?: boolean;
}

const baseNavItems: NavItem[] = [
  { href: '/', label: '首頁', icon: 'Home' },
  { href: '/tutorials', label: '教學', icon: 'BookOpen' },
  { href: '/scenarios', label: '情境', icon: 'Puzzle' },
  { href: '/dashboard', label: '進度紀錄', icon: 'LayoutDashboard', authRequired: true },
];

const authNavItems: NavItem[] = [
  { href: '/login', label: '登入', icon: LogIn, hideWhenAuthed: true },
  { href: '/register', label: '註冊', icon: UserPlus, hideWhenAuthed: true },
];


interface SidebarNavProps {
  isMobile?: boolean;
  className?: string;
}

export function SidebarNav({ isMobile = false, className }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const navItems = [
    ...baseNavItems.filter(item => !item.authRequired || (item.authRequired && user)),
    ...authNavItems.filter(item => item.hideWhenAuthed && !user),
  ];

  const renderNavItem = (item: NavItem) => {
    const IconComponent = typeof item.icon === 'string' ? Icons[item.icon as keyof typeof Icons] : item.icon;
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    
    return (
      <Link href={item.href} key={item.href} legacyBehavior passHref>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start h-10 mb-1',
             isActive ? 'text-primary-foreground bg-primary hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground'
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          <IconComponent className="mr-3 h-5 w-5" />
          {item.label}
        </Button>
      </Link>
    );
  };
  
  const NavContent = () => (
    <nav className={cn('flex flex-col p-4 space-y-1', className)}>
      {!loading && navItems.map(renderNavItem)}
      {user && !loading && (
        <Button
          variant={'ghost'}
          className={cn(
            'w-full justify-start h-10 mb-1',
            'hover:bg-destructive hover:text-destructive-foreground'
          )}
          onClick={logout}
        >
          <LogOutIcon className="mr-3 h-5 w-5" />
          登出
        </Button>
      )}
      {loading && (
        <>
          <Button variant="ghost" className="w-full justify-start h-10 mb-1" disabled>載入中...</Button>
          <Button variant="ghost" className="w-full justify-start h-10 mb-1" disabled>載入中...</Button>
          <Button variant="ghost" className="w-full justify-start h-10 mb-1" disabled>載入中...</Button>
        </>
      )}
    </nav>
  );


  if (isMobile) {
    return (
      <ScrollArea className="h-[calc(100vh-4rem)]"> {/* Adjusted height for mobile header */}
        <NavContent />
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <NavContent />
    </ScrollArea>
  );
}
