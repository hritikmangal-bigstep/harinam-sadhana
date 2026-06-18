// Overwritten by Amplify preBuild with real values — never commit real credentials here.
// Local dev: process.env from .env.local takes precedence over these placeholders.
export const buildEnv = {
  S3_REGION: '',
  S3_BUCKET: '',
  S3_ACCESS_KEY_ID: '',
  S3_SECRET_ACCESS_KEY: '',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: '',
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: '',
  GOOGLE_SHEETS_ID: '',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
} as const;
