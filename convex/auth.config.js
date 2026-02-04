// Clerk JWT issuer URL format: https://<your-clerk-domain>.clerk.accounts.dev
// You can find this in your Clerk Dashboard:
// 1. Go to JWT Templates → Create template named "convex"
// 2. The issuer URL is shown in the template
// 3. Or it's typically: https://<your-app-name>.clerk.accounts.dev
// 
// Set CLERK_ISSUER_URL in .env.local explicitly for best results

function getClerkIssuerUrl() {
  // Use explicit environment variable if set
  if (process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL) {
    return process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL;
  }
  
  // Try to derive from publishable key (format: pk_test_<domain>)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (publishableKey) {
    // Extract domain from publishable key
    // Format: pk_test_<domain> or pk_live_<domain>
    const parts = publishableKey.replace(/^pk_(test|live)_/, "").split(".");
    if (parts.length > 0) {
      return `https://${parts[0]}.clerk.accounts.dev`;
    }
  }
  
  // Fallback (you should set CLERK_ISSUER_URL explicitly)
  return "https://your-clerk-domain.clerk.accounts.dev";
}

export default {
  providers: [
    {
      domain: getClerkIssuerUrl(),
      applicationID: "convex",
    },
  ],
};

