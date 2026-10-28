import { useEffect, useRef, useState } from 'react';
import { Download, HardDriveDownload, ShieldCheck, Smartphone, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { exportData, importData } from '@/lib/export';
import { sampleNotes } from '@/lib/sampleData';
import { clearAllData, getSettings, listNotes, putNotes } from '@/lib/storage';
import { btnDanger, btnOutline, btnPrimary, btnSize, cardBase, inputBase, labelBase } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { useSettings } from '@/state/settings';
import type { ImageFont, ImageSpacing, PrintSize, ThemeMode } from '@/types/note';

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
  { value: 'system', label: 'Sistem' },
];

const PRINTS: { value: PrintSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'thermal', label: 'Thermal 80mm' },
];

const IMAGE_FONTS: { value: ImageFont; label: string }[] = [
  { value: 'Arial', label: 'Modern' },
  { value: 'Georgia', label: 'Elegan' },
  { value: 'Courier New', label: 'Mono' },
];

const IMAGE_SPACING: { value: ImageSpacing; label: string }[] = [
  { value: 'compact', label: 'Rapat' },
  { value: 'comfortable', label: 'Nyaman' },
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
  const [storeName, setStoreName] = useState(settings.storeName);

  useEffect(() => {
    setStoreName(settings.storeName);
  }, [settings.storeName]);

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
      const count = await importData(file, { applySettings: true });
      update(await getSettings());
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
    update({ storeName: '' });
    await refresh();
    setConfirmClear(false);
    toast.success('Semua data dihapus');
  };

  const handleStoreNameSave = () => {
    update({ storeName: storeName.trim() });
    toast.success('Nama toko disimpan');
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
        <div className="grid gap-3 pt-1 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 text-sm font-medium">
            <span>
              Warna pengurangan
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Default merah</span>
            </span>
            <input
              type="color"
              value={settings.reductionColor}
              onChange={(event) => update({ reductionColor: event.target.value })}
              aria-label="Warna pengurangan"
              data-testid="reduction-color-input"
              className="h-10 w-14 cursor-pointer rounded-md border border-input bg-card p-1"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm font-medium">
            <span>
              Warna total
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Kontras hijau</span>
            </span>
            <input
              type="color"
              value={settings.totalColor}
              onChange={(event) => update({ totalColor: event.target.value })}
              aria-label="Warna total"
              data-testid="total-color-input"
              className="h-10 w-14 cursor-pointer rounded-md border border-input bg-card p-1"
            />
          </label>
        </div>
        <div className="border-t border-border pt-4">
          <span className={labelBase}>Hasil gambar bagikan</span>
          <p className="mt-1 text-sm text-muted-foreground">PNG dibuat dengan ukuran tetap agar tajam, rapi, dan tetap ringan.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-sm font-medium">Font</span>
              <div className="mt-2">
                <Segmented options={IMAGE_FONTS} value={settings.imageFont} onChange={(imageFont) => update({ imageFont })} name="image-font" />
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Jarak spasi</span>
              <div className="mt-2">
                <Segmented options={IMAGE_SPACING} value={settings.imageSpacing} onChange={(imageSpacing) => update({ imageSpacing })} name="image-spacing" />
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              <span>
                Garis bantu
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Pembatas antar bagian nota</span>
              </span>
              <input
                type="checkbox"
                checked={settings.imageGuides}
                onChange={(event) => update({ imageGuides: event.target.checked })}
                aria-label="Garis bantu gambar"
                data-testid="image-guides-input"
                className="h-5 w-5 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              <span>
                Latar gambar
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Warna kertas nota</span>
              </span>
              <input
                type="color"
                value={settings.imageBackground}
                onChange={(event) => update({ imageBackground: event.target.value })}
                aria-label="Latar gambar"
                data-testid="image-background-input"
                className="h-10 w-14 cursor-pointer rounded-md border border-input bg-card p-1"
              />
            </label>
          </div>
        </div>
      </section>

      <section className={cn(cardBase, 'space-y-3 p-4 sm:p-5')} data-testid="store-settings">
        <div>
          <span className={labelBase}>Toko</span>
          <label htmlFor="store-name" className="mt-2 block text-sm font-medium">
            Nama toko
          </label>
          <input
            id="store-name"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            placeholder=""
            autoComplete="organization"
            data-testid="store-name-input"
            className={cn(inputBase, 'mt-2 h-11')}
          />
          <p className="mt-2 text-xs text-muted-foreground">Nama toko akan digunakan pada nota dan saat membagikan nota.</p>
        </div>
        <button
          type="button"
          onClick={handleStoreNameSave}
          data-testid="save-store-name-btn"
          className={cn(btnPrimary, btnSize.sm, 'w-fit')}
        >
          Simpan
        </button>
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
         description="Semua nota, nama toko, dan draft di perangkat ini akan dihapus permanen."
        confirmLabel="Hapus semua"
        onConfirm={handleClear}
        testId="confirm-delete-all"
      />
    </div>
  );
};
