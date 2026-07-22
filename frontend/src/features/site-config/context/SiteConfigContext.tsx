import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useToastStore } from '../../../shared/store/useToastStore';
import { siteConfigService } from './SiteConfigService';
import type { BtPrinter } from './SiteConfigTypes';

interface SiteConfigContextType {
  // Theme Store Original Values
  colorPrimary: string;
  colorSecondary: string;
  colorNavbar: string;

  // Theme Form Input States & Setters
  primaryInput: string;
  setPrimaryInput: (val: string) => void;
  secondaryInput: string;
  setSecondaryInput: (val: string) => void;
  navbarInput: string;
  setNavbarInput: (val: string) => void;
  titleInput: string;
  setTitleInput: (val: string) => void;
  logoInput: string;
  setLogoInput: (val: string) => void;
  browserTitleInput: string;
  setBrowserTitleInput: (val: string) => void;
  machineTypesInput: string;
  setMachineTypesInput: (val: string) => void;

  // Theme Action States
  isSaving: boolean;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  successMsg: string | null;
  errorMsg: string | null;

  // Theme Action Handlers
  handleSaveTheme: () => Promise<void>;
  handleResetTheme: () => Promise<void>;
  processLogoFile: (file: File) => Promise<void>;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;

  // BT Printers States
  printers: BtPrinter[];
  printerLoading: boolean;
  editingPrinter: Partial<BtPrinter> | null;
  setEditingPrinter: React.Dispatch<React.SetStateAction<Partial<BtPrinter> | null>>;
  printerError: string | null;
  setPrinterError: (msg: string | null) => void;
  isPairing: boolean;

  // BT Printers Handlers
  handlePairNewPrinter: () => Promise<void>;
  handleSavePrinterEdit: () => Promise<void>;
  handleDeletePrinter: (id: number) => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  // Global Theme Store Access
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const colorSecondary = useThemeStore((state) => state.colorSecondary);
  const colorNavbar = useThemeStore((state) => state.colorNavbar);
  const systemTitle = useThemeStore((state) => state.systemTitle);
  const systemLogo = useThemeStore((state) => state.systemLogo);
  const browserTitle = useThemeStore((state) => state.browserTitle);
  const machineTypes = useThemeStore((state) => state.machineTypes);
  const updateTheme = useThemeStore((state) => state.updateTheme);

  // Form Input States
  const [primaryInput, setPrimaryInput] = useState(colorPrimary);
  const [secondaryInput, setSecondaryInput] = useState(colorSecondary);
  const [navbarInput, setNavbarInput] = useState(colorNavbar);
  const [titleInput, setTitleInput] = useState(systemTitle);
  const [logoInput, setLogoInput] = useState(systemLogo);
  const [browserTitleInput, setBrowserTitleInput] = useState(browserTitle);
  const [machineTypesInput, setMachineTypesInput] = useState(machineTypes);

  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync inputs when theme store updates
  useEffect(() => {
    setPrimaryInput(colorPrimary);
    setSecondaryInput(colorSecondary);
    setNavbarInput(colorNavbar);
    setTitleInput(systemTitle);
    setLogoInput(systemLogo);
    setBrowserTitleInput(browserTitle);
    setMachineTypesInput(machineTypes);
  }, [colorPrimary, colorSecondary, colorNavbar, systemTitle, systemLogo, browserTitle, machineTypes]);

  // Logo Processor
  const processLogoFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    try {
      const dataUrl = await siteConfigService.processLogoFile(file);
      setLogoInput(dataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membaca gambar logo.');
      useToastStore.getState().showToast(err.message || 'Gagal membaca logo.', 'error');
    }
  }, []);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  }, [processLogoFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  }, [processLogoFile]);

  // Save Theme Config
  const handleSaveTheme = useCallback(async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateTheme({
        color_primary: primaryInput,
        color_secondary: secondaryInput,
        color_navbar: navbarInput,
        system_title: titleInput,
        system_logo: logoInput,
        browser_title: browserTitleInput,
        machine_types: machineTypesInput,
      });
      const msg = 'Konfigurasi berhasil disimpan dan diperbarui secara global.';
      setSuccessMsg(msg);
      useToastStore.getState().showToast(msg, 'success');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      const err = 'Gagal menyimpan konfigurasi branding.';
      setErrorMsg(err);
      useToastStore.getState().showToast(err, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [primaryInput, secondaryInput, navbarInput, titleInput, logoInput, browserTitleInput, machineTypesInput, updateTheme]);

  // Reset Theme Config
  const handleResetTheme = useCallback(async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateTheme({
        color_primary: '#008d51',
        color_secondary: '#E76114',
        color_navbar: '#037233',
        system_title: 'PT. Sugity Creatives',
        system_logo: '',
        browser_title: 'SC Prod Plan',
        machine_types: 'injection,painting',
      });
      const msg = 'Branding warna dan identitas telah dikembalikan ke standar bawaan.';
      setSuccessMsg(msg);
      useToastStore.getState().showToast(msg, 'success');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      const err = 'Gagal mengembalikan konfigurasi branding.';
      setErrorMsg(err);
      useToastStore.getState().showToast(err, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [updateTheme]);

  // ── Bluetooth Printer Registry States ──
  const [printers, setPrinters] = useState<BtPrinter[]>([]);
  const [printerLoading, setPrinterLoading] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Partial<BtPrinter> | null>(null);
  const [printerError, setPrinterError] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  const fetchPrinters = useCallback(async () => {
    setPrinterLoading(true);
    try {
      const list = await siteConfigService.fetchPrinters();
      setPrinters(list);
    } catch {
      // ignore
    } finally {
      setPrinterLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  const handlePairNewPrinter = useCallback(async () => {
    setIsPairing(true);
    setPrinterError(null);
    try {
      const savedUuids = printers.map((p) => p.service_uuid);
      const pairedDevice = await siteConfigService.pairBluetoothDevice(savedUuids);

      await siteConfigService.registerPrinter({
        name: pairedDevice.name,
        service_uuid: pairedDevice.serviceUuid,
        notes: 'Paired via Site Config',
      });

      useToastStore.getState().showToast(`Printer Bluetooth "${pairedDevice.name}" berhasil dipasang.`, 'success');
      await fetchPrinters();
    } catch (e: any) {
      if (e?.name !== 'NotFoundError') {
        const msg = e?.message || 'Pairing gagal. Coba lagi.';
        setPrinterError(msg);
        useToastStore.getState().showToast(msg, 'error');
      }
    } finally {
      setIsPairing(false);
    }
  }, [printers, fetchPrinters]);

  const handleSavePrinterEdit = useCallback(async () => {
    const validationError = siteConfigService.validatePrinterEdit(editingPrinter?.name, editingPrinter?.service_uuid);
    if (validationError) {
      setPrinterError(validationError);
      return;
    }

    setPrinterError(null);
    try {
      await siteConfigService.updatePrinter(editingPrinter!.id!, {
        name: editingPrinter!.name!,
        service_uuid: editingPrinter!.service_uuid!,
        notes: editingPrinter!.notes || null,
      });
      setEditingPrinter(null);
      useToastStore.getState().showToast('Data printer berhasil diperbarui.', 'success');
      await fetchPrinters();
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Gagal menyimpan printer.';
      setPrinterError(msg);
      useToastStore.getState().showToast(msg, 'error');
    }
  }, [editingPrinter, fetchPrinters]);

  const handleDeletePrinter = useCallback(async (id: number) => {
    if (!confirm('Hapus printer ini dari registry?')) return;
    try {
      await siteConfigService.deletePrinter(id);
      useToastStore.getState().showToast('Printer berhasil dihapus dari registry.', 'success');
      await fetchPrinters();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menghapus printer.';
      useToastStore.getState().showToast(msg, 'error');
    }
  }, [fetchPrinters]);

  return (
    <SiteConfigContext.Provider
      value={{
        colorPrimary,
        colorSecondary,
        colorNavbar,
        primaryInput,
        setPrimaryInput,
        secondaryInput,
        setSecondaryInput,
        navbarInput,
        setNavbarInput,
        titleInput,
        setTitleInput,
        logoInput,
        setLogoInput,
        browserTitleInput,
        setBrowserTitleInput,
        machineTypesInput,
        setMachineTypesInput,
        isSaving,
        isDragging,
        setIsDragging,
        successMsg,
        errorMsg,
        handleSaveTheme,
        handleResetTheme,
        processLogoFile,
        handleLogoChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        printers,
        printerLoading,
        editingPrinter,
        setEditingPrinter,
        printerError,
        setPrinterError,
        isPairing,
        handlePairNewPrinter,
        handleSavePrinterEdit,
        handleDeletePrinter,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfigContext() {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfigContext must be used within a SiteConfigProvider');
  }
  return context;
}
