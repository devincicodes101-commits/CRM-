export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <span className="font-bold text-base">BuildStream</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 text-xs text-muted-foreground text-center">
          Powered by BuildStream CRM
        </div>
      </footer>
    </div>
  );
}