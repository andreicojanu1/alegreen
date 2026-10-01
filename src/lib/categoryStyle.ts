import { Lightbulb, Microwave, Monitor, Smartphone, SolarPanel, Thermometer, WashingMachine, type LucideIcon } from 'lucide-react';

/**
 * Culori și iconițe fixe pe categorie, folosite consecvent în toată aplicația (donut, legendă, tabele).
 * Paleta categorială validată pentru daltoniști (skill dataviz, scripts/validate_palette.js, mod light):
 * separare CVD minimă între vecini ΔE 9,1, normal-vision ΔE 19,6. Ordinea urmează ordinea de afișare a categoriilor
 * active (2, 3, 4, 5, 6, 4B), iar cat. 1 (inactivă) primește ultimul slot.
 * Trei culori au contrast < 3:1 pe alb, de aceea categoriile apar mereu și cu cod + nume (legendă, tabele).
 */
export const CATEGORY_STYLE: Record<string, { color: string; icon: LucideIcon; scurt: string }> = {
  '2': { color: '#2a78d6', icon: Monitor, scurt: 'Ecrane' },
  '3': { color: '#eb6834', icon: Lightbulb, scurt: 'Lămpi' },
  '4': { color: '#1baf7a', icon: WashingMachine, scurt: 'Echipamente mari' },
  '5': { color: '#eda100', icon: Microwave, scurt: 'Echipamente mici' },
  '6': { color: '#e87ba4', icon: Smartphone, scurt: 'IT&C mici' },
  '4B': { color: '#008300', icon: SolarPanel, scurt: 'Panouri fotovoltaice' },
  '1': { color: '#4a3aa7', icon: Thermometer, scurt: 'Transfer termic' },
};

export const categoryColor = (cod: string) => CATEGORY_STYLE[cod]?.color ?? '#9ca3af';
