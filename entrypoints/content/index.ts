/**
 * Adapted from ente-auth-extension content/index.tsx (AGPL-3.0).
 * Watches the page for a code field, asks the background to poll faster,
 * and fills when a code arrives or the inline chip is clicked.
 */
import { browser } from 'wxt/browser';
import type { FillResponse } from '~/lib/messages';
import { fillCode } from '~/lib/otp-autofill';
import { getBestOtpField, type OtpFieldDetection } from '~/lib/otp-detector';
import { hideChip, showChip } from './chip';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',
  main() {
    if (!document.body) return;
    let currentDetection: OtpFieldDetection | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let hasShown = false;
    let lastUrl = window.location.href;
    let fastTimer: ReturnType<typeof setInterval> | undefined;
    let fastTicks = 0;

    const sendMessageWithRetry = async (message: unknown, retries = 2): Promise<unknown> => {
      try {
        return await browser.runtime.sendMessage(message);
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        if (text.includes('Extension context invalidated')) return null;
        if (text.includes('Could not establish connection') || text.includes('Receiving end does not exist')) {
          if (retries <= 0) return null;
          await new Promise((resolve) => setTimeout(resolve, 100));
          return sendMessageWithRetry(message, retries - 1);
        }
        return null;
      }
    };

    const resetState = (): void => {
      hideChip();
      hasShown = false;
      currentDetection = null;
      if (fastTimer) clearInterval(fastTimer);
      fastTimer = undefined;
    };

    const isDetectionValid = (): boolean => {
      const element = currentDetection?.element;
      if (!element) return false;
      if (!document.body.contains(element)) return false;
      if (!element.offsetParent && element.style.position !== 'fixed') return false;
      return true;
    };

    const startFastPoll = (): void => {
      void sendMessageWithRetry({ type: 'OTP_PAGE_DETECTED' });
      fastTicks = 0;
      if (fastTimer) return;
      fastTimer = setInterval(() => {
        fastTicks += 1;
        if (fastTicks > 40) {
          clearInterval(fastTimer);
          fastTimer = undefined;
          return;
        }
        void sendMessageWithRetry({ type: 'POLL' });
      }, 3000);
    };

    const renderChip = (): void => {
      if (!currentDetection || currentDetection.confidence < 0.3) {
        hideChip();
        return;
      }
      const isSplit = currentDetection.type === 'split' && !!currentDetection.splitInputs?.length;
      const anchor = isSplit
        ? currentDetection.splitInputs![currentDetection.splitInputs!.length - 1]!
        : currentDetection.element;
      showChip(anchor, isSplit ? 'outside' : 'inside', (code) => {
        if (currentDetection) fillCode(currentDetection, code, false);
      });
    };

    const checkForOtpFields = (): void => {
      if (hasShown) return;
      const detection = getBestOtpField(0.3);
      if (!detection) return;
      currentDetection = detection;
      hasShown = true;
      renderChip();
      if (detection.confidence >= 0.5) startFastPoll();
    };

    const debouncedCheck = (): void => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkForOtpFields, 500);
    };

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      const request = message as { type?: string; code?: string; autoSubmit?: boolean };
      if (request.type !== 'FILL_OTP' || !request.code) return;
      const detection = getBestOtpField(0.5);
      if (!detection) {
        sendResponse({ filled: false } satisfies FillResponse);
        return;
      }
      currentDetection = detection;
      fillCode(detection, request.code, request.autoSubmit === true);
      renderChip();
      sendResponse({ filled: true } satisfies FillResponse);
    });

    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.otpState) return;
      if (currentDetection && isDetectionValid()) renderChip();
    });

    debouncedCheck();

    const observer = new MutationObserver((mutations) => {
      const hasInputs = mutations.some((mutation) => {
        if (mutation.type !== 'childList') return false;
        return Array.from(mutation.addedNodes).some(
          (node) => node instanceof HTMLElement && (node.tagName === 'INPUT' || node.querySelector?.('input')),
        );
      });
      if (hasInputs) debouncedCheck();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener(
      'focusin',
      (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        if (!hasShown) {
          debouncedCheck();
          return;
        }
        const target = event.target;
        const matches =
          currentDetection?.element === target || currentDetection?.splitInputs?.includes(target);
        if (matches && (currentDetection?.confidence ?? 0) >= 0.5) startFastPoll();
      },
      true,
    );

    window.addEventListener('beforeunload', () => hideChip());
    window.addEventListener('popstate', () => {
      resetState();
      debouncedCheck();
    });

    setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        resetState();
        debouncedCheck();
        return;
      }
      if (hasShown && !isDetectionValid()) {
        resetState();
        debouncedCheck();
      }
    }, 500);
  },
});
