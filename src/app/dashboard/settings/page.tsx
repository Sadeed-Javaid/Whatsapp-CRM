import WhatsAppConnectButton from "@/components/settings/whatsapp-connect-button";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">WhatsApp Connection</h1>
      <WhatsAppConnectButton />
    </div>
  );
}