'use client';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Tsanaae. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
