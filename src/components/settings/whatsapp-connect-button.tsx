"use client";

import { useEffect, useCallback, useState, useRef } from "react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID!;
const CONFIG_ID = process.env.NEXT_PUBLIC_FB_CONFIG_ID!;
const GRAPH_VERSION = process.env.NEXT_PUBLIC_GRAPH_API_VERSION || "v25.0";

export default function WhatsAppConnectButton() {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "syncing" | "done" | "error">("idle");

  const signupData = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  useEffect(() => {
    if (document.getElementById("fb-jssdk")) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "fb-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: GRAPH_VERSION,
      });
      setSdkReady(true);
    };
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;

      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type !== "WA_EMBEDDED_SIGNUP") return;

      if (data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
        signupData.current = {
          wabaId: data.data?.waba_id,
          phoneNumberId: data.data?.phone_number_id,
        };
        setStatus("syncing");
      } else if (data.event === "CANCEL") {
        setStatus("idle");
      } else if (data.event === "ERROR") {
        setStatus("error");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const launchSignup = useCallback(() => {
    if (!window.FB) return;
    setStatus("connecting");

    window.FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          fetch("/api/whatsapp/exchange-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: response.authResponse.code,
              wabaId: signupData.current.wabaId,
              phoneNumberId: signupData.current.phoneNumberId,
            }),
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.success) setStatus("done");
              else setStatus("error");
            })
            .catch(() => setStatus("error"));
        } else {
          setStatus("idle");
        }
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
        },
      }
    );
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={launchSignup}
        disabled={!sdkReady || status === "connecting" || status === "syncing"}
        className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {status === "connecting" && "Connecting..."}
        {status === "syncing" && "Syncing your WhatsApp..."}
        {status === "done" && "Connected ✓"}
        {(status === "idle" || status === "error") && "Connect your WhatsApp number"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}