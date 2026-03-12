export function Pagination({
  current,
  total,
  tab,
}: {
  current: number;
  total: number;
  tab: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {current > 1 && (
        <a
          href={`/discover?tab=${tab}&page=${current - 1}`}
          className="rounded-lg border border-border/50 px-3 py-1.5 text-sm hover:bg-accent/50"
        >
          Previous
        </a>
      )}
      <span className="text-sm text-muted-foreground">
        Page {current} of {total}
      </span>
      {current < total && (
        <a
          href={`/discover?tab=${tab}&page=${current + 1}`}
          className="rounded-lg border border-border/50 px-3 py-1.5 text-sm hover:bg-accent/50"
        >
          Next
        </a>
      )}
    </div>
  );
}
