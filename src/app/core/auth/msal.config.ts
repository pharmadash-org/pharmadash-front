import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel,
} from '@azure/msal-browser';
import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

const { clientId, tenantId, redirectUri, postLogoutRedirectUri, scopes } =
  environment.msalConfig;

const isIE =
  typeof window !== 'undefined' &&
  (window.navigator.userAgent.indexOf('MSIE ') > -1 ||
    window.navigator.userAgent.indexOf('Trident/') > -1);

/**
 * Instancia MSAL configurada con Authorization Code Flow + PKCE.
 * (No se habilita el flujo implícito.)
 */
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri,
      postLogoutRedirectUri,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: isIE,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message) => {
          if (!environment.production && level === LogLevel.Error) {
            console.error(message);
          }
        },
        logLevel: environment.production ? LogLevel.Error : LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  });
}

/**
 * Mapea las rutas /api/* del backend al scope protegido, de modo que el
 * MsalInterceptor adjunte el Bearer token automáticamente.
 */
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set(environment.apiUrl, scopes);
  protectedResourceMap.set('/api', scopes);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

/** Configuración del MsalGuard: login por redirect con el scope del backend. */
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes,
    },
    loginFailedRoute: '/login',
  };
}
