import type { CategoryRule } from './types';

/**
 * Nomenclatorul categoriilor cu regulile implicite (brief RB-05, DAT-01).
 * Cat. 1 (transfer termic) există în platformă, dar e inactivă (screenshot 05).
 * Ordinea implicită a pool-ului: 2, 3, 4, 5, 6, 4B (RB-08).
 */
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  { cod: '2', denumire: 'Ecrane, monitoare și echipamente cu ecrane', folosestePragImplicit: true, pragMinimPropriu: '0.3', plafonSubstitutie: '0.7', ordineAlocare: 10, activ: true },
  { cod: '3', denumire: 'Lămpi', folosestePragImplicit: false, pragMinimPropriu: '1', plafonSubstitutie: '0', ordineAlocare: 20, activ: true },
  { cod: '4', denumire: 'Echipamente de mari dimensiuni', folosestePragImplicit: true, pragMinimPropriu: '0.3', plafonSubstitutie: '0.7', ordineAlocare: 30, activ: true },
  { cod: '5', denumire: 'Echipamente de mici dimensiuni', folosestePragImplicit: true, pragMinimPropriu: '0.3', plafonSubstitutie: '0.7', ordineAlocare: 40, activ: true },
  { cod: '6', denumire: 'Echipamente IT&C mici', folosestePragImplicit: true, pragMinimPropriu: '0.3', plafonSubstitutie: '0.7', ordineAlocare: 50, activ: true },
  { cod: '4B', denumire: 'Panouri fotovoltaice', folosestePragImplicit: false, pragMinimPropriu: '0', plafonSubstitutie: '1', ordineAlocare: 60, activ: true },
  { cod: '1', denumire: 'Echipamente de transfer termic', folosestePragImplicit: true, pragMinimPropriu: '0.3', plafonSubstitutie: '0.7', ordineAlocare: 70, activ: false },
];

/** Ordinea de afișare în tabele (după cod), independentă de ordinea pool-ului. */
export const CATEGORY_DISPLAY_ORDER = ['1', '2', '3', '4', '5', '6', '4B'];
export const byDisplayOrder = (a: string, b: string) =>
  CATEGORY_DISPLAY_ORDER.indexOf(a) - CATEGORY_DISPLAY_ORDER.indexOf(b);
