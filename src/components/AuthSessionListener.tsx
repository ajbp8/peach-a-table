"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Magic-link and invite emails redirect here with the session encoded in
// the URL hash (#access_token=...&type=magiclink). Supabase's browser SDK
// reads that hash automatically the moment it's instantiated and turns it
// into a real session — but nothing in the app ever instantiated the
// browser client, so the hash just sat there unused. The middleware would
// see no session cookie, redirect to /login, and the user would be stuck
// looking at the sign-in form forever, even though Supabase's own
// dashboard showed them as already signed in.
export default function AuthSessionListener() {
  useEffect(() => {
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // Full reload, not a client-side route change — the new session
        // cookie needs to be sent on the next request so the server
        // middleware (which gates every page) actually sees it.
        window.location.assign("/");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return null;
}
