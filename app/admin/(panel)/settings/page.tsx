import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Site Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Site identity, pagination limit and social links shown in the footer.
      </p>
      <div className="mt-6">
        <SettingsForm initial={getSettings()} />
      </div>
    </div>
  );
}
