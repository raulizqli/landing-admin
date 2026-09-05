import { httpsCallable } from 'firebase/functions';
import { getHubFunctions } from './firebaseClients';

export async function submitPageInquiryRemote(payload) {
  const callable = httpsCallable(getHubFunctions(), 'submitPageInquiry');
  const result = await callable(payload);
  return result.data;
}
