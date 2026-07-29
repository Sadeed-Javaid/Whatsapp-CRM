"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <span className="text-destructive text-lg">!</span>
      </div>
      <h2 className="text-sm font-semibold text-foreground">Something went wrong</h2>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-xl transition-all"
      >
        Try again
      </button>
    </div>
  );
}
