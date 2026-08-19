export const FACEBOOK_DOMAIN_VERIFICATION = 'ae4ufr4msxzf5gogjhwthwt1mhzlze';

/** Keep in sync with the static tag in landing-admin/index.html. */
export default function FacebookDomainVerification() {
  return (
    <meta
      name="facebook-domain-verification"
      content={FACEBOOK_DOMAIN_VERIFICATION}
    />
  );
}
