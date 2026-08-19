import { SiteConfigProvider } from '../context/SiteConfigContext';
import SiteConfigHeader from '../components/SiteConfigHeader';
import SiteConfigThemeForm from '../components/SiteConfigThemeForm';
import SiteConfigPreviewMockup from '../components/SiteConfigPreviewMockup';
import SiteConfigPrinterRegistry from '../components/SiteConfigPrinterRegistry';
import SiteConfigQrWebhookForm from '../components/SiteConfigQrWebhookForm';

function SiteConfigPageContent() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <SiteConfigHeader />

      {/* Grid Layout: Configuration Form & Real-time Mockup */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <SiteConfigThemeForm />
        </div>
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <SiteConfigPreviewMockup />
        </div>
      </div>

      {/* QR Webhook Integration Configuration */}
      <SiteConfigQrWebhookForm />

      {/* Bluetooth Printer Registry */}
      <SiteConfigPrinterRegistry />
    </div>
  );
}

export default function SiteConfigPage() {
  return (
    <SiteConfigProvider>
      <SiteConfigPageContent />
    </SiteConfigProvider>
  );
}