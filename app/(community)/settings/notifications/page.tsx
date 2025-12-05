"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";

export default function NotificationSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you want to be notified about activity in the community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NotificationPreferencesForm />
      </CardContent>
    </Card>
  );
}
