/**
 * Pembungkus tipe untuk komponen shadcn/ui bawaan template (file .jsx).
 * Radix menyediakan perilaku, wrapper ini hanya memberi tipe agar TS strict lolos.
 */
import type { ComponentType, ReactNode } from 'react';
import * as Dropdown from '@/components/ui/dropdown-menu';
import * as Alert from '@/components/ui/alert-dialog';

type AnyProps = Record<string, unknown> & { children?: ReactNode };

const typed = (value: unknown): ComponentType<AnyProps> => value as ComponentType<AnyProps>;

export const DropdownMenu = typed(Dropdown.DropdownMenu);
export const DropdownMenuTrigger = typed(Dropdown.DropdownMenuTrigger);
export const DropdownMenuContent = typed(Dropdown.DropdownMenuContent);
export const DropdownMenuItem = typed(Dropdown.DropdownMenuItem);
export const DropdownMenuSeparator = typed(Dropdown.DropdownMenuSeparator);

export const AlertDialog = typed(Alert.AlertDialog);
export const AlertDialogContent = typed(Alert.AlertDialogContent);
export const AlertDialogHeader = typed(Alert.AlertDialogHeader);
export const AlertDialogTitle = typed(Alert.AlertDialogTitle);
export const AlertDialogDescription = typed(Alert.AlertDialogDescription);
export const AlertDialogFooter = typed(Alert.AlertDialogFooter);
export const AlertDialogCancel = typed(Alert.AlertDialogCancel);
export const AlertDialogAction = typed(Alert.AlertDialogAction);
