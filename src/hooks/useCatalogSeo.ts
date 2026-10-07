import { useEffect } from 'react';

const SITE = 'https://xn--80aagkc8a6anj.xn--p1ai';
const URL = `${SITE}/objects`;
const IMAGE = 'https://cdn.poehali.dev/files/91da8d9c-1e35-40e5-9d98-edb903030696.jpeg';

const TITLE = 'Каталог инвестиционной недвижимости: квартиры, коммерция, парковки | AREALVEST';
const DESCRIPTION =
  'Каталог проверенных инвестиционных объектов: квартиры, коммерческая недвижимость, парковки, кладовые и земля. Доходность, срок окупаемости и сумма входа по каждому объекту.';

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  const prev = tag.getAttribute('content');
  tag.setAttribute('content', content);
  return () => {
    if (prev !== null) tag?.setAttribute('content', prev);
  };
};

export const useCatalogSeo = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;

    const restores = [
      setMeta('name', 'description', DESCRIPTION),
      setMeta('property', 'og:type', 'website'),
      setMeta('property', 'og:title', TITLE),
      setMeta('property', 'og:description', DESCRIPTION),
      setMeta('property', 'og:url', URL),
      setMeta('property', 'og:image', IMAGE),
      setMeta('name', 'twitter:title', TITLE),
      setMeta('name', 'twitter:description', DESCRIPTION),
      setMeta('name', 'twitter:image', IMAGE),
    ];

    const canonical = document.head.querySelector('link[rel="canonical"]');
    const prevHref = canonical?.getAttribute('href') ?? null;
    canonical?.setAttribute('href', URL);

    return () => {
      document.title = prevTitle;
      restores.forEach((r) => r());
      if (canonical && prevHref !== null) canonical.setAttribute('href', prevHref);
    };
  }, []);
};

export default useCatalogSeo;
