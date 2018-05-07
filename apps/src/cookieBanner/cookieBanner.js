import cookies from 'js-cookie';
import { getRootDomainFromHostname } from '@cdo/apps/code-studio/utils';

window.setupCookieBanner = (environment) => {
  const cookieName = '_cookieBanner' +
    (environment === 'production' ? '' : ('_' + environment));
  const banner = document.getElementById("cookie-banner");
  const rootDomain = getRootDomainFromHostname(document.location.hostname);
  const value = cookies.get(cookieName);

  // Only show the cookie banner on test environment if there is a special
  // URL parameter, which will be used for testing.
  const hideCookie =
    environment === 'test' &&
    window.location.search.indexOf("show_cookie_banner_on_test") === -1;

  if (!value && !hideCookie) {
    banner.style.display = "block";

    banner.onclick = () => {
      cookies.set(cookieName, '1', {expires: 10 * 365, domain: rootDomain});
      banner.style.display = "none";
    };
  }
};
