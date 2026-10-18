import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function StudentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-28 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Filters bar */}
      <div className="flex gap-3 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" style={{ opacity: 1 - i * 0.08 }} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
