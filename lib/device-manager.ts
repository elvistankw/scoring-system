// Device ID management for judge identity selection
// Requirements: Device-based judge sessions, unique device identification

import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'judge_device_id';
const DEVICE_FINGERPRINT_KEY = 'judge_device_fingerprint';

/**
 * Generate browser fingerprint for additional device identification
 */
export function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvas.toDataURL()
  ].join('|');

  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Get or create device ID
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('🆔 Generated new device ID:', deviceId.substring(0, 8) + '...');
  }

  return deviceId;
}

/**
 * Get or create browser fingerprint
 */
export function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let fingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  
  if (!fingerprint) {
    fingerprint = generateBrowserFingerprint();
    localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
    console.log('🔍 Generated browser fingerprint:', fingerprint);
  }

  return fingerprint;
}

/**
 * Clear device identification (for testing or reset)
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_FINGERPRINT_KEY);
  console.log('🧹 Cleared device identification');
}

/**
 * Get device info for debugging
 */
export function getDeviceInfo(): {
  deviceId: string;
  fingerprint: string;
  userAgent: string;
  screen: string;
  timezone: number;
} {
  if (typeof window === 'undefined') {
    return {
      deviceId: '',
      fingerprint: '',
      userAgent: '',
      screen: '',
      timezone: 0
    };
  }

  return {
    deviceId: getDeviceId(),
    fingerprint: getBrowserFingerprint(),
    userAgent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    timezone: new Date().getTimezoneOffset()
  };
}

/**
 * Validate device ID format
 */
export function isValidDeviceId(deviceId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(deviceId);
}

/**
 * Device manager class for easier usage
 */
export class DeviceManager {
  private static instance: DeviceManager;
  
  private constructor() {}
  
  static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }
  
  getDeviceId(): string {
    return getDeviceId();
  }
  
  getBrowserFingerprint(): string {
    return getBrowserFingerprint();
  }
  
  getDeviceInfo() {
    return getDeviceInfo();
  }
  
  clearDevice(): void {
    clearDeviceId();
  }
  
  isValidDeviceId(deviceId: string): boolean {
    return isValidDeviceId(deviceId);
  }
}

// Export singleton instance
export const deviceManager = DeviceManager.getInstance();