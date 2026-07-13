// Keep in sync with landing-template/src/utils/domainRouting.js

import { getHubDb } from './firebaseClients';
import { findPageRouteByDomain as lookupPageRouteByDomain } from './firestoreAccess';
import { shouldUseExternalFirebase } from './externalFirebase';
import { normalizePageData } from './pageModel';
import { isLocalHostname, normalizeHostname } from './hostname';

export { normalizeHostname, isLocalHostname } from './hostname';

export function getPageIdFromSearchParams(searchParams) {
  const params = searchParams instanceof URLSearchParams
    ? searchParams
    : new URLSearchParams(window.location.search);
  return params.get('pageId') || params.get('paginaId') || '';
}

export async function resolvePageContext({
  searchParams,
  envPageId = '',
  hostname = window.location.hostname,
  isDev = import.meta.env.DEV,
} = {}) {
  const fromQuery = getPageIdFromSearchParams(searchParams);
  if (fromQuery) {
    return {
      pageId: fromQuery,
      source: 'query',
      routeData: null,
    };
  }

  const normalizedHost = normalizeHostname(hostname);
  const canUseDomainRouting = !isDev && !isLocalHostname(normalizedHost);

  if (canUseDomainRouting) {
    const route = await lookupPageRouteByDomain(getHubDb(), normalizedHost);
    if (route) {
      return {
        pageId: route.pageId,
        source: 'domain',
        routeData: normalizePageData(route.routeData),
      };
    }
    return null;
  }

  const fromEnv = String(envPageId ?? '').trim();
  if (fromEnv) {
    return {
      pageId: fromEnv,
      source: 'env',
      routeData: null,
    };
  }

  return null;
}

export function resolveContentTarget(routeData) {
  if (shouldUseExternalFirebase(routeData)) {
    return {
      useExternalFirebase: true,
      externalFirebase: routeData.externalFirebase,
    };
  }
  return {
    useExternalFirebase: false,
    externalFirebase: null,
  };
}
