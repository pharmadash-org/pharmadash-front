export const environment = {
  production: false,
  apiUrl: '/api/v1',
  msalConfig: {
    clientId: '00000000-0000-0000-0000-000000000000',
    tenantId: '00000000-0000-0000-0000-000000000000',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200/login',
    scopes: ['api://00000000-0000-0000-0000-000000000000/access_as_user'],
  },
};
