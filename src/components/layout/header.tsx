
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Added SheetHeader, SheetTitle
import { Menu, UserCircle, LogOutIcon, Spade } from 'lucide-react'; // Spade Icon
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const APP_NAME = "poker"; // 更新應用程式名稱

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  const getInitials = (email?: string | null) => {
    if (!email) return '使用者';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center space-x-2">
           {/* Mobile Nav Trigger */}
          <div className="md:hidden mr-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">切換選單</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-4 border-b text-left">
                  <SheetTitle>
                    <Link href="/" className="flex items-center space-x-2 text-inherit">
                      <Icons.Spade className="h-6 w-6 text-primary" />
                      <span className="font-bold">{APP_NAME}</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <SidebarNav isMobile={true} />
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="flex items-center space-x-2">
            <Icons.Spade className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">
              {APP_NAME}
            </span>
          </Link>
        </div>


        <div className="flex items-center space-x-2">
          {loading ? (
            <Button variant="ghost" size="sm" disabled>載入中...</Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {/* <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} /> */}
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem asChild>
                  <Link href="/profile">個人資料</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">設定</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator /> */}
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">登入</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">註冊</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
