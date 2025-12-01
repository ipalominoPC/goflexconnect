/**
 * Form Autosave Service
 *
 * Provides localStorage-based draft saving for project forms
 * to prevent data loss during session expiration or browser refresh.
 */

const AUTOSAVE_PREFIX = 'goflexconnect_draft_';
const AUTOSAVE_TIMESTAMP_SUFFIX = '_timestamp';

export interface AutosaveMetadata {
  timestamp: number;
  formKey: string;
}

/**
 * Save form draft to localStorage
 * @param formKey - Unique key for the form (e.g., "donor_alignment:projectId")
 * @param data - Form data to save
 */
export function saveDraft(formKey: string, data: any): void {
  try {
    const key = AUTOSAVE_PREFIX + formKey;
    const timestampKey = key + AUTOSAVE_TIMESTAMP_SUFFIX;

    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(timestampKey, Date.now().toString());

    console.log(`Draft saved: ${formKey}`);
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

/**
 * Load form draft from localStorage
 * @param formKey - Unique key for the form
 * @returns Saved draft data or null if not found
 */
export function loadDraft(formKey: string): any | null {
  try {
    const key = AUTOSAVE_PREFIX + formKey;
    const saved = localStorage.getItem(key);

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}

/**
 * Get draft metadata (timestamp)
 * @param formKey - Unique key for the form
 * @returns Metadata or null
 */
export function getDraftMetadata(formKey: string): AutosaveMetadata | null {
  try {
    const key = AUTOSAVE_PREFIX + formKey;
    const timestampKey = key + AUTOSAVE_TIMESTAMP_SUFFIX;
    const timestamp = localStorage.getItem(timestampKey);

    if (!timestamp) {
      return null;
    }

    return {
      timestamp: parseInt(timestamp, 10),
      formKey,
    };
  } catch (error) {
    console.error('Failed to get draft metadata:', error);
    return null;
  }
}

/**
 * Clear form draft from localStorage
 * @param formKey - Unique key for the form
 */
export function clearDraft(formKey: string): void {
  try {
    const key = AUTOSAVE_PREFIX + formKey;
    const timestampKey = key + AUTOSAVE_TIMESTAMP_SUFFIX;

    localStorage.removeItem(key);
    localStorage.removeItem(timestampKey);

    console.log(`Draft cleared: ${formKey}`);
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
}

/**
 * Check if a draft exists for a form
 * @param formKey - Unique key for the form
 * @returns true if draft exists
 */
export function hasDraft(formKey: string): boolean {
  const key = AUTOSAVE_PREFIX + formKey;
  return localStorage.getItem(key) !== null;
}

/**
 * Get all saved drafts
 * @returns Array of draft metadata
 */
export function getAllDrafts(): AutosaveMetadata[] {
  const drafts: AutosaveMetadata[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUTOSAVE_PREFIX) && !key.endsWith(AUTOSAVE_TIMESTAMP_SUFFIX)) {
        const formKey = key.replace(AUTOSAVE_PREFIX, '');
        const metadata = getDraftMetadata(formKey);
        if (metadata) {
          drafts.push(metadata);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all drafts:', error);
  }

  return drafts;
}

/**
 * Clear all drafts (useful for cleanup)
 */
export function clearAllDrafts(): void {
  try {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUTOSAVE_PREFIX)) {
        keys.push(key);
      }
    }

    keys.forEach((key) => localStorage.removeItem(key));
    console.log(`Cleared ${keys.length} drafts`);
  } catch (error) {
    console.error('Failed to clear all drafts:', error);
  }
}

/**
 * Clear old drafts (older than specified days)
 * @param daysOld - Number of days to keep drafts
 */
export function clearOldDrafts(daysOld: number = 7): void {
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  const drafts = getAllDrafts();

  drafts.forEach((draft) => {
    if (draft.timestamp < cutoffTime) {
      clearDraft(draft.formKey);
    }
  });
}

/**
 * Debounced save function generator
 * @param callback - Function to call after debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function createDebouncedSave<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 2000
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
}
