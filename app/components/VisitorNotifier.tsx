"use client";

import { useEffect } from "react";

export default function VisitorNotifier() {
  useEffect(() => {
    if (window.location.hostname === "localhost") return;
    async function notify() {
      try {
        const ipRes = await fetch("https://ipapi.co/json/", { cache: "no-store" });
        if (!ipRes.ok) return;
        const ipData = await ipRes.json();

        const location = [ipData.city, ipData.region, ipData.country_name]
          .filter(Boolean)
          .join(", ");

        await fetch("/api/notify-visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip: ipData.ip || "unknown",
            location: location || "Unknown",
          }),
        });
      } catch {
        // silent fail
      }
    }

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => notify(), { timeout: 5000 });
    } else {
      setTimeout(() => notify(), 2000);
    }
  }, []);

  return null;
}
