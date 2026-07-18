
import { hasValidFirebaseConfig, normalizeFirebaseConfig } from './firebaseConfig.js';
import { getHostingDeployRoutingFields } from './hostingDeploy.js';

export const EMPTY_EXTERNAL_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export function normalizeExternalFirebase(config = {}) {
  return normalizeFirebaseConfig({ ...EMPTY_EXTERNAL_FIREBASE, ...(config && typeof config === 'object' ? config : {}) });
}

export function shouldUseExternalFirebase(pageData) {
  return pageData?.useExternalFirebase === true
    && hasValidFirebaseConfig(pageData?.externalFirebase);
}

export function getHubRoutingFields(pageData = {}) {
  return {
    name: pageData.name || '',
    customDomain: pageData.customDomain || '',
    siteMode: pageData.siteMode === 'marketing' ? 'marketing' : 'landing',
    useExternalFirebase: pageData.useExternalFirebase === true,
    externalFirebase: normalizeExternalFirebase(pageData.externalFirebase),
    ...getHostingDeployRoutingFields(pageData),
  };
}

export function mergeHubRouteWithExternalContent(hubRoute, externalData = {}) {
  const route = getHubRoutingFields(hubRoute);
  return {
    ...externalData,
    ...route,
    externalFirebase: route.externalFirebase,
  };
}

export function splitPageSavePayload(formData = {}) {
  const routing = getHubRoutingFields(formData);
  const content = { ...formData, ...routing };

  if (shouldUseExternalFirebase(formData)) {
    return {
      useExternal: true,
      hubData: routing,
      contentData: content,
    };
  }

  return {
    useExternal: false,
    hubData: content,
    contentData: content,
  };
}
