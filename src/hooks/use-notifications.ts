import { useEffect, useState, useCallback } from "react";

export type NotificationPermissionState = NotificationPermission | "unsupported";

const DISMISS_KEY = "hkeeem-notifications-dismissed";

export interface NotificationState {
  permission: NotificationPermissionState;
  dismissed: boolean;
  isReady: boolean;
  request: () => Promise<NotificationPermissionState>;
  dismiss: () => void;
  reset: () => void;
}

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(DISMISS_KEY, "1");
    else window.localStorage.removeItem(DISMISS_KEY);
  } catch {
    // ignore
  }
}

export function useNotifications(): NotificationState {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [dismissed, setDismissed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      setDismissed(false);
      setIsReady(true);
      return;
    }

    setPermission(Notification.permission);
    setDismissed(readDismissed());
    setIsReady(true);
  }, []);

  const request = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        writeDismissed(true);
        setDismissed(true);
      }
      return result;
    } catch {
      setPermission("default");
      return "default";
    }
  }, []);

  const dismiss = useCallback(() => {
    writeDismissed(true);
    setDismissed(true);
  }, []);

  const reset = useCallback(() => {
    writeDismissed(false);
    setDismissed(false);
  }, []);

  return { permission, dismissed, isReady, request, dismiss, reset };
}
