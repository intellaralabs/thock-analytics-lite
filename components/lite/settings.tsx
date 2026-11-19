"use client";

import { useTheme } from "next-themes";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { me, workspace } from "@/data/analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/lite/page-header";

const notifications = [
  { id: "n-churn", label: "Customer churns", hint: "Any paying account cancels", on: true },
  { id: "n-spike", label: "Traffic spikes", hint: "Visitors 50% above the daily average", on: true },
  { id: "n-weekly", label: "Weekly summary", hint: "Mondays at 9:00", on: false },
];

const noop = () => () => {};

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  // The theme is only known in the browser; render the radio group unselected on the server.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [saved, setSaved] = useState(false);

  function save(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  return (
    <>
      <PageHeader title="Settings" description="Your profile and how the app behaves." />
      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Shown to other people in {workspace.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} onChange={() => setSaved(false)} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Name">
                  <Input name="name" defaultValue={me.name} autoComplete="name" />
                </FormField>
                <FormField label="Email">
                  <Input name="email" type="email" defaultValue={me.email} autoComplete="email" />
                </FormField>
              </div>
              <FormField label="Workspace name">
                <Input name="workspace" defaultValue={workspace.name} />
              </FormField>
              {saved && (
                <Alert variant="success">
                  <AlertDescription>Saved.</AlertDescription>
                </Alert>
              )}
              <Button type="submit" variant="accent" className="w-fit">
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mounted ? theme : undefined} onValueChange={setTheme} aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "Match system" },
              ].map((o) => (
                <div key={o.value} className="flex items-center gap-3">
                  <RadioGroupItem id={`theme-${o.value}`} value={o.value} />
                  <Label htmlFor={`theme-${o.value}`}>{o.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="gap-0">
            {notifications.map((n, i) => (
              <div key={n.id}>
                {i > 0 && <Separator className="my-1" />}
                <div className="flex items-center gap-4 py-3">
                  <label htmlFor={n.id} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block text-sm font-medium text-fg">{n.label}</span>
                    <span className="block text-xs text-subtle">{n.hint}</span>
                  </label>
                  <Switch id={n.id} size="sm" defaultChecked={n.on} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
