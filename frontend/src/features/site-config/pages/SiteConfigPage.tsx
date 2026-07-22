import { SiteConfigProvider } from '../context/SiteConfigContext';
import SiteConfigHeader from '../components/SiteConfigHeader';
import SiteConfigThemeForm from '../components/SiteConfigThemeForm';
import SiteConfigPreviewMockup from '../components/SiteConfigPreviewMockup';
import SiteConfigPrinterRegistry from '../components/SiteConfigPrinterRegistry';

function SiteConfigPageContent() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <SiteConfigHeader />

      {/* Grid Layout: Configuration Form & Real-time Mockup */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col">
          <SiteConfigThemeForm />
        </div>
        <div className="lg:col-span-7 flex flex-col">
          <SiteConfigPreviewMockup />
        </div>
      </div>

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