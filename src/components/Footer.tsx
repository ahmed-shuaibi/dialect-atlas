export function Footer({ releaseId }: { releaseId?: string }) {
  return (
    <footer className="site-shell pb-8 pt-16">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[11px] font-medium text-muted">
        <span>DIALECT Atlas · manuscript companion</span>
        {releaseId && <span className="font-mono text-[10px]">{releaseId}</span>}
      </div>
    </footer>
  );
}
