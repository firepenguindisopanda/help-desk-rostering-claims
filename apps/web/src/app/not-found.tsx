import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <EmptyState
          title="Page not found"
          description="We couldn't find what you're looking for."
        />
        <div className="mt-4 text-center space-y-2">
          <Link 
            href="/" 
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </Link>
          <p className="text-sm text-muted-foreground">
            Or <Link href="/" className="underline">return home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}