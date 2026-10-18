import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function StaffLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
