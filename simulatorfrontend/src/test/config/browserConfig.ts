export interface BrowserConfig {
  name: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  features: {
    localStorage: boolean;
    sessionStorage: boolean;
    webGL: boolean;
    touchEvents: boolean;
  };
}

export const BROWSER_CONFIGS: BrowserConfig[] = [
  {
    name: 'Chrome Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    features: {
      localStorage: true,
      sessionStorage: true,
      webGL: true,
      touchEvents: false
    }
  },
  {
    name: 'Firefox Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    viewport: { width: 1920, height: 1080 },
    features: {
      localStorage: true,
      sessionStorage: true,
      webGL: true,
      touchEvents: false
    }
  },
  {
    name: 'Safari Desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    viewport: { width: 1920, height: 1080 },
    features: {
      localStorage: true,
      sessionStorage: true,
      webGL: true,
      touchEvents: false
    }
  },
  {
    name: 'Edge Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    viewport: { width: 1920, height: 1080 },
    features: {
      localStorage: true,
      sessionStorage: true,
      webGL: true,
      touchEvents: false
    }
  },
  {
    name: 'Chrome Mobile',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    viewport: { width: 375, height: 667 },
    features: {
      localStorage: true,
      sessionStorage: true,
      webGL: true,
      touchEvents: true
    }
  },
  {
    name: 'Safari Mobile',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 812 },
    features: {
      localStorage: true,
      sessionStorage: true,
      webGL: true,
      touchEvents: true
    }
  },
  {
    name: 'Firefox Mobile',
    userAgent: 'Mozilla/5.0 (Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
    viewport: { width: 375, height: 667 },
    features: {
      localStorage: true,
      sessionStorage: true,
      webGL: true,
      touchEvents: true
    }
  },
  {
    name: 'Tablet',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 768, height: 1024 },
    features: {
      localStorage: true,
      sessionStorage: true,
      webGL: true,
      touchEvents: true
    }
  }
];

export const ACCESSIBILITY_STANDARDS = {
  WCAG_2_1: {
    levelA: [
      'keyboard-navigation',
      'alt-text',
      'heading-structure',
      'form-labels'
    ],
    levelAA: [
      'color-contrast',
      'focus-visible',
      'resize-text',
      'touch-targets'
    ],
    levelAAA: [
      'enhanced-contrast',
      'context-help',
      'error-prevention'
    ]
  }
};

export const PERFORMANCE_THRESHOLDS = {
  firstContentfulPaint: 1500, // ms
  largestContentfulPaint: 2500, // ms
  firstInputDelay: 100, // ms
  cumulativeLayoutShift: 0.1,
  timeToInteractive: 3000 // ms
};