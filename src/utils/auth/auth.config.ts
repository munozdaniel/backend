interface AuthConfig {
    CLIENT_ID: string;
    CLIENT_DOMAIN: string;
    AUDIENCE: string;
    REDIRECT: string;
    SCOPE: string;
  };
  const { CLIENT_ID_OAUTH2,BASE_API} = process.env;

  export const AUTH_CONFIG: AuthConfig = {
    CLIENT_ID: CLIENT_ID_OAUTH2,
    CLIENT_DOMAIN: '[AUTH0_CLIENT_DOMAIN]', // e.g., you.auth0.com
    AUDIENCE: '[YOUR_AUTH0_API_AUDIENCE]', // e.g., http://localhost:8083/api/
    REDIRECT: `${BASE_API}/callback`,
    SCOPE: 'openid profile'
  };