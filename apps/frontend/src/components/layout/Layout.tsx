import type { ReactNode } from 'react';
import { IconNavigation } from './IconNavigation';

type LayoutProps = {
  sidebar?: ReactNode;
  children: ReactNode;
};

export const Layout = ({ sidebar, children }: LayoutProps) => {
  return (
    <div className="h-screen flex bg-background text-foreground">
      <IconNavigation />
      {sidebar}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
};
