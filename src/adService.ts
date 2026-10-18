import { sound } from './audio';

declare global {
  interface Window {
    gdsdk?: {
      showAd: (type?: 'rewarded') => Promise<unknown>;
    };
    GD_OPTIONS?: Record<string, unknown>;
  }
}

class AdService {
  private lastInterstitialTime: number = 0;
  private readonly INTERSTITIAL_COOLDOWN_MS = 60000; // 60s cooldown for player-friendly pacing
  private pendingRewardCallback: (() => void) | null = null;
  private gameInstance: { isPaused: boolean } | null = null;

  constructor() {
    this.initEventListeners();
  }

  public registerGameInstance(game: { isPaused: boolean }) {
    this.gameInstance = game;
  }

  private initEventListeners() {
    window.addEventListener('gd_event', (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string }>;
      const eventName = customEvent.detail?.name;

      switch (eventName) {
        case 'SDK_GAME_PAUSE':
          // Strictly mute audio and pause game when video ad starts
          sound.pauseAudio();
          if (this.gameInstance) {
            this.gameInstance.isPaused = true;
          }
          break;

        case 'SDK_GAME_START':
          // Resume audio and game when ad finishes or closes
          sound.resumeAudio();
          if (this.gameInstance) {
            this.gameInstance.isPaused = false;
          }
          break;

        case 'SDK_REWARDED_WATCH_COMPLETE':
          // Reward granted natively via GD SDK event
          if (this.pendingRewardCallback) {
            const cb = this.pendingRewardCallback;
            this.pendingRewardCallback = null;
            cb();
          }
          break;
      }
    });
  }

  /**
   * Request a Rewarded Video Ad via GameDistribution SDK
   * If unavailable, blocked, or in development mode, invokes the fallback simulation.
   */
  public showRewardedAd(title: string, onReward: () => void, fallbackSimulator: (title: string, onReward: () => void) => void) {
    if (typeof window !== 'undefined' && window.gdsdk && typeof window.gdsdk.showAd === 'function') {
      let rewardGranted = false;

      this.pendingRewardCallback = () => {
        rewardGranted = true;
        onReward();
      };

      window.gdsdk.showAd('rewarded')
        .then(() => {
          // If promise resolves but watch complete didn't fire for some edge browser reason, ensure reward
          if (!rewardGranted && this.pendingRewardCallback) {
            const cb = this.pendingRewardCallback;
            this.pendingRewardCallback = null;
            cb();
          }
        })
        .catch((err) => {
          console.warn('[GD SDK] Rewarded ad not available or failed:', err);
          this.pendingRewardCallback = null;
          // Fallback to simulated ad so player experience is never blocked
          fallbackSimulator(title, onReward);
        });
    } else {
      // SDK not loaded or blocked by local environment - use simulated arcade ad
      fallbackSimulator(title, onReward);
    }
  }

  /**
   * Request a Midroll / Interstitial Ad with a safe cooldown
   */
  public showInterstitialAd(placement: string = 'midroll') {
    const now = Date.now();
    if (now - this.lastInterstitialTime < this.INTERSTITIAL_COOLDOWN_MS) {
      return; // Skip if within cooldown period
    }

    if (typeof window !== 'undefined' && window.gdsdk && typeof window.gdsdk.showAd === 'function') {
      this.lastInterstitialTime = now;
      window.gdsdk.showAd()
        .then(() => {
          console.log(`[GD SDK] Interstitial ad (${placement}) completed`);
        })
        .catch((err) => {
          console.log(`[GD SDK] Interstitial ad (${placement}) skipped or unavailable`, err);
        });
    }
  }
}

export const adService = new AdService();
