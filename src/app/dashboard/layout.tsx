export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <div className="flex h-dvh flex-col overflow-clip">{children}</div>;
}
