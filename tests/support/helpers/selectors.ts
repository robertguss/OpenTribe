/**
 * Common Selectors for E2E Tests
 *
 * Centralize selectors to reduce duplication and improve maintainability.
 * Use data-testid attributes for stability.
 */

// Navigation
export const selectors = {
  // Navigation
  nav: {
    root: '[data-testid="navigation"]',
    logo: '[data-testid="logo"]',
    loginLink: '[data-testid="login-link"]',
    signupLink: '[data-testid="signup-link"]',
    userMenu: '[data-testid="user-menu"]',
    logoutButton: '[data-testid="logout-button"]',
  },

  // Auth forms
  auth: {
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    nameInput: '[data-testid="name-input"]',
    loginButton: '[data-testid="login-button"]',
    signupButton: '[data-testid="signup-button"]',
    errorMessage: '[data-testid="auth-error"]',
  },

  // Dashboard
  dashboard: {
    root: '[data-testid="dashboard"]',
    welcomeMessage: '[data-testid="welcome-message"]',
    sidebar: '[data-testid="sidebar"]',
  },

  // Spaces
  spaces: {
    list: '[data-testid="spaces-list"]',
    card: '[data-testid="space-card"]',
    createButton: '[data-testid="create-space-button"]',
  },

  // Common
  common: {
    loadingSpinner: '[data-testid="loading"]',
    errorAlert: '[data-testid="error-alert"]',
    successAlert: '[data-testid="success-alert"]',
  },
} as const;

/**
 * Helper to get a selector by path
 *
 * Usage:
 *   getSelector('auth.emailInput') // returns '[data-testid="email-input"]'
 */
export function getSelector(path: string): string {
  const parts = path.split('.');
  let current: unknown = selectors;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      throw new Error(`Selector not found: ${path}`);
    }
  }

  if (typeof current !== 'string') {
    throw new Error(`Invalid selector path: ${path}`);
  }

  return current;
}
