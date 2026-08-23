import { AppHeader } from '@/components/AppHeader';
import { SettingsPanel } from '@/components/SettingsPanel';

export default function Settings() {
  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 md:px-8 md:pt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pengaturan</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tema, cetak, dan cadangan data. Semua diproses di perangkat Anda.
        </p>

        <div className="mt-7">
          <SettingsPanel />
        </div>
      </main>
    </div>
  );
}
