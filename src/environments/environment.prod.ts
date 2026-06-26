export const environment = {
  production: true,
  apiUrl: '/api/v1',
  msalConfig: {
    clientId: '<FRONTEND_CLIENT_ID>',
    tenantId: 'deca26fd-d64e-49f4-95ed-87ecaf3e0e47',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin + '/login',
    scopes: ['api://8b0c8ee9-27b9-4707-9ec1-be36ab90ea63/access_as_user'],
  },
};
