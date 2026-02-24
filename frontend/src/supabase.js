import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_PUBLIC_SUPABASE_URL; // make sure var names match
const supabaseAnonKey = process.env.REACT_APP_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl, "Key:", supabaseAnonKey?.slice(0, 5) + "..."); // test

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple test: ping auth API
(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Supabase connection error:", error.message);
    } else {
      console.log("✅ Supabase connected! Session data:", data);
    }
  } catch (err) {
    console.error("❌ Failed to reach Supabase:", err);
  }
})();
