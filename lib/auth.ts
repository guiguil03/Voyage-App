import { betterAuth } from "better-auth";
import { ENV_CONFIG } from "../env.config";

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: ENV_CONFIG.DATABASE_URL,
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    apple: {
      clientId: ENV_CONFIG.APPLE_CLIENT_ID,
      clientSecret: ENV_CONFIG.APPLE_CLIENT_SECRET,
    },
    facebook: {
      clientId: ENV_CONFIG.FACEBOOK_CLIENT_ID,
      clientSecret: ENV_CONFIG.FACEBOOK_CLIENT_SECRET,
    },
    google: {
      clientId: ENV_CONFIG.GOOGLE_CLIENT_ID,
      clientSecret: ENV_CONFIG.GOOGLE_CLIENT_SECRET,
    },
  },
}); 