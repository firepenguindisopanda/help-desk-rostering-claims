"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RequireRole } from "@/components/RequireRole";
import { AssistantLayout } from "@/components/layouts/AssistantLayout";
import { ApiV2 } from "@/lib/api";
import { toast } from "sonner";

export default function AssistantProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await ApiV2.getMe();
      if (res.success && res.user) {
        setName(res.user.name || "");
        setEmail(res.user.email || "");
      }
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    const res = await ApiV2.updateMe({ name });
    setSaving(false);
    if (res.success) toast.success("Profile updated"); else toast.error(res.error || "Update failed");
  };

  return (
    <RequireRole role="assistant">
      <AssistantLayout>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </CardContent>
        </Card>
      </AssistantLayout>
    </RequireRole>
  );
}
