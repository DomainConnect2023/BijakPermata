import { useEffect, useState } from "react";

import { type AccessKey, getAccessId } from "@/constants/access";
import { useAuth } from "@/contexts/auth-context";
import { checkPageAccess } from "@/services/access-api";

export function usePageAccess<K extends AccessKey>(keys: K[]) {
  const { user } = useAuth();
  const keysSignature = keys.join(",");

  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<Record<K, boolean>>(
    () => Object.fromEntries(keys.map((key) => [key, false])) as Record<K, boolean>,
  );

  useEffect(() => {
    let cancelled = false;
    const activeKeys = keysSignature.split(",").filter(Boolean) as K[];

    (async () => {
      setLoading(true);

      if (!user) {
        if (!cancelled) {
          setAccess(
            Object.fromEntries(activeKeys.map((key) => [key, false])) as Record<K, boolean>,
          );
          setLoading(false);
        }
        return;
      }

      try {
        const results = await Promise.all(
          activeKeys.map((key) =>
            checkPageAccess({ userId: user.userId, accessId: getAccessId(key) }),
          ),
        );
        if (!cancelled) {
          setAccess(
            Object.fromEntries(
              activeKeys.map((key, index) => [key, results[index]]),
            ) as Record<K, boolean>,
          );
        }
      } catch {
        if (!cancelled) {
          setAccess(
            Object.fromEntries(activeKeys.map((key) => [key, false])) as Record<K, boolean>,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, keysSignature]);

  return { loading, access };
}
