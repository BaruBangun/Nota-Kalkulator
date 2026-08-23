import { useEffect, useRef, useState } from 'react';
import { Download, HardDriveDownload, ShieldCheck, Smartphone, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { exportData, importData } from '@/lib/export';
import { sampleNotes } from '@/lib/sampleData';
import { clearAllData, listNotes, putNotes } from '@/lib/storage';
import { btnDanger, btnOutline, btnPrimary, btnSize, cardBase, labelBase } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { useSettings } from '@/state/settings';
import type { PrintSize, ThemeMode } from '@/types/note';

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
  { value: 'system', label: 'Sistem' },
];

const PRINTS: { value: PrintSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'thermal', label: 'Thermal 80mm' },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  name: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full bg-secondary p-1" role="group" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          data-testid={`${name}-${option.value}`}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150',
            value === option.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const SettingsPanel = () => {
  const { settings, update } = useSettings();
  const { canInstall, installed, install } = useInstallPrompt();
  const fileRef = useRef<HTMLInputElement>(null);
  const [noteCount, setNoteCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = () => listNotes().then((notes) => setNoteCount(notes.length));

  useEffect(() => {
    void refresh();
  }, []);

  const handleExport = async () => {
    const { noteCount: count, fileName } = await exportData();
    toast.success(`${count} nota diekspor`, { description: fileName });
  };

  const handleImport = async (file: File) => {
    try {
      const count = await importData(file);
      await refresh();
      toast.success(`${count} nota diimpor`);
    } catch (error) {
      toast.error('Gagal mengimpor', { description: error instanceof Error ? error.message : undefined });
    }
  };

  const handleSample = async () => {
    await putNotes(sampleNotes());
    await refresh();
    toast.success('Contoh data dimuat', { description: 'Lihat di halaman Riwayat' });
  };

  const handleClear = async () => {
    await clearAllData();
    await refresh();
    setConfirmClear(false);
    toast.success('Semua data dihapus');
  };

  return (
    <div className="space-y-4" data-testid="settings-panel">
      <section className={cn(cardBase, 'space-y-4 p-4 sm:p-5')}>
        <div>
          <span className={labelBase}>Tampilan</span>
          <p className="mt-1 text-sm text-muted-foreground">Tema mengikuti perangkat bila memilih Sistem.</p>
        </div>
        <Segmented options={THEMES} value={settings.theme} onChange={(theme) => update({ theme })} name="theme" />
        <div className="pt-1">
          <span className={labelBase}>Ukuran cetak</span>
          <div className="mt-2">
            <Segmented
              options={PRINTS}
              value={settings.printSize}
              onChange={(printSize) => update({ printSize })}
              name="print"
            />
          </div>
        </div>
      </section>

      <section className={cn(cardBase, 'space-y-3 p-4 sm:p-5')}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={labelBase}>Data</span>
          <span className="font-mono text-xs text-muted-foreground" data-testid="settings-note-count">
            {noteCount} nota tersimpan
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} data-testid="export-data-btn" className={cn(btnOutline, btnSize.md)}>
            <Download className="h-4 w-4" /> Export data
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            data-testid="import-data-btn"
            className={cn(btnOutline, btnSize.md)}
          >
            <Upload className="h-4 w-4" /> Import data
          </button>
          <button type="button" onClick={handleSample} data-testid="load-sample-btn" className={cn(btnOutline, btnSize.md)}>
            <Sparkles className="h-4 w-4" /> Muat contoh data
          </button>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            data-testid="delete-all-btn"
            className={cn(btnDanger, btnSize.md)}
          >
            <Trash2 className="h-4 w-4" /> Hapus semua data
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="import-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void handleImport(file);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Export menghasilkan berkas <span className="font-mono">nota-backup.json</span> yang bisa diimpor di perangkat
          lain.
        </p>
      </section>

      {!installed && (
        <section className={cn(cardBase, 'flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5')}>
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Pasang di perangkat</p>
              <p className="text-xs text-muted-foreground">
                Tambahkan ke layar utama agar terbuka layar penuh dan tetap jalan tanpa internet.
              </p>
            </div>
          </div>
          {canInstall && (
            <button type="button" onClick={install} data-testid="install-pwa-btn" className={cn(btnPrimary, btnSize.sm)}>
              <HardDriveDownload className="h-4 w-4" /> Pasang
            </button>
          )}
        </section>
      )}

      <section className={cn(cardBase, 'flex items-start gap-3 p-4 sm:p-5')} data-testid="privacy-info">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Data Anda tersimpan di perangkat ini</p>
          <p className="mt-1 text-xs text-muted-foreground">
            NotaKalk bekerja sepenuhnya offline. Tidak ada nota yang dikirim ke server mana pun.
          </p>
        </div>
      </section>

      <p className="px-1 pb-2 font-mono text-[11px] text-muted-foreground">NotaKalk · Level 2 · v1.0.0</p>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Hapus semua data?"
        description="Seluruh nota dan draft di perangkat ini akan dihapus permanen."
        confirmLabel="Hapus semua"
        onConfirm={handleClear}
        testId="confirm-delete-all"
      />
    </div>
  );
};
