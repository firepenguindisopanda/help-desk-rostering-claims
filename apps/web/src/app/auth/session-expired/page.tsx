"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SessionExpiredPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Session expired</CardTitle>
          <CardDescription>Your session has ended. You can go back and try again.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 justify-center">
          <Button onClick={() => router.back()}>Go back</Button>
        </CardContent>
      </Card>
    </div>
  );
}
