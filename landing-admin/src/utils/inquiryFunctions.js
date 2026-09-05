import { httpsCallable } from 'firebase/functions';
import { getHubFunctions } from './firebaseClients';

export async function submitPageInquiryRemote(payload) {
  const callable = httpsCallable(getHubFunctions(), 'submitPageInquiry');
  const result = await callable(payload);
  return result.data;
}

export async function listPageInquiriesRemote({ pageId, limit = 30 } = {}) {
  const callable = httpsCallable(getHubFunctions(), 'listPageInquiries');
  const result = await callable({ pageId, limit });
  return result.data;
}
