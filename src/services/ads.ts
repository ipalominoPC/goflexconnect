/**
 * Advertisement service for GoFlexConnect
 * Manages house ads displayed to FREE tier users only
 */

export type AdPlacement =
  | 'dashboard-footer'
  | 'speedtest-banner'
  | 'analytics-sidebar';

export interface AdDefinition {
  id: string;
  placement: AdPlacement;
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl: string;
  active: boolean;
}

const ADS: AdDefinition[] = [
  {
    id: 'gfc-das-design',
    placement: 'dashboard-footer',
    title: 'Professional DAS Design by GoFlexCloud',
    description: 'Need help interpreting surveys or designing coverage? Book a design review with GoFlexCloud.',
    imageUrl: '/icons/logo-128.png',
    targetUrl: 'https://goflexconnect.com',
    active: true,
  },
  {
    id: 'gfc-survey-services',
    placement: 'speedtest-banner',
    title: 'On-site RF Survey Services',
    description: 'Let GoFlexCloud handle full walk tests, rooftop donor selection, and reporting.',
    imageUrl: '/icons/logo-128.png',
    targetUrl: 'https://goflexconnect.com',
    active: true,
  },
  {
    id: 'gfc-training',
    placement: 'analytics-sidebar',
    title: 'DAS & RF Training Sessions',
    description: 'Learn how to go from raw measurements to confident designs with expert-led sessions.',
    imageUrl: '/icons/logo-128.png',
    targetUrl: 'https://goflexconnect.com',
    active: true,
  },
];

/**
 * Get an active ad for a specific placement
 * @param placement - The placement location for the ad
 * @returns AdDefinition if found and active, null otherwise
 */
export function getAdForPlacement(placement: AdPlacement): AdDefinition | null {
  const ad = ADS.find(a => a.placement === placement && a.active);
  return ad ?? null;
}
