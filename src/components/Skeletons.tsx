import { cn } from "@/lib/utils";

export function SkeletonBox({ className }: { className?: string }) {
  return <div className={cn("skeleton-box rounded-xl", className)} />;
}

export function DealCardSkeleton() {
  return (
    <div className="bg-card rounded-3xl border border-border/50 shadow-card overflow-hidden">
      <SkeletonBox className="aspect-square rounded-none" />
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <SkeletonBox className="w-6 h-6 rounded-lg" />
          <SkeletonBox className="h-3 flex-1" />
        </div>
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-2/3" />
        <div className="flex items-end justify-between pt-1">
          <SkeletonBox className="h-6 w-20" />
          <SkeletonBox className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DealGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-border/50 bg-card shadow-card flex items-center gap-3">
      <SkeletonBox className="w-14 h-14 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/3" />
        <SkeletonBox className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4, grid = false }: { count?: number; grid?: boolean }) {
  return (
    <div className={grid ? "grid sm:grid-cols-2 gap-3" : "space-y-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}
