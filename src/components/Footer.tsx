export function Footer({ releaseId }: { releaseId?: string }) {
  return (
    <footer className="site-shell pb-10 pt-20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs font-semibold text-muted">
        <span>DIALECT manuscript companion.</span>
        {releaseId && <span className="font-mono text-[10px]">{releaseId}</span>}
      </div>
    </footer>
  );
}
