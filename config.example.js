// FOR RUNNING ON YOUR OWN COMPUTER ONLY.
// Copy this file, name the copy config.js, and paste in your Supabase values.
// Find them in Supabase: click "Connect" (or Project Settings → API).
//
// config.js is listed in .gitignore, so it is never uploaded to GitHub.
// On Vercel, build.sh creates config.js from your environment variables instead.
//
// The project URL and the anon (or "publishable") key are meant to be used
// in the browser; the security rules in supabase/schema.sql protect the data.
// NEVER put the service_role / secret key or your database password here.
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT-ID.supabase.co",
  supabaseAnonKey: "YOUR-ANON-OR-PUBLISHABLE-KEY",
};
