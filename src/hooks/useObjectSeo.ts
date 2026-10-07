import { useEffect } from 'react';
import { InvestmentObject, PROPERTY_TYPE_LABELS } from '@/types/investment-object';
import { formatPrice } from '@/utils/formatPrice';

const SITE = 'https://xn--80aagkc8a6anj.xn--p1ai';

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const cut = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

export const useObjectSeo = (object: InvestmentObject | undefined) => {
  useEffect(() => {
    if (!object) return;

    const typeLabel = PROPERTY_TYPE_LABELS[object.type] || 'Недвижимость';
    const url = `${SITE}/objects/${object.id}`;
    const price = object.price ? formatPrice(object.price) : '';
    const yieldText = object.yield ? `доходность ${object.yield}%` : '';

    const title = cut(
      [
        `${object.title}`,
        object.city ? `— ${typeLabel.toLowerCase()} в г. ${object.city}` : `— ${typeLabel.toLowerCase()}`,
        yieldText ? `, ${yieldText}` : '',
        price ? `, ${price}` : '',
        ' | AREALVEST',
      ].join(''),
      110,
    );

    const description = cut(
      [
        `${typeLabel}: ${object.title}${object.city ? `, ${object.city}` : ''}${object.address ? `, ${object.address}` : ''}.`,
        price ? `Цена ${price}.` : '',
        object.area ? `Площадь ${object.area} м².` : '',
        object.yield ? `Ожидаемая доходность ${object.yield}% годовых.` : '',
        object.paybackPeriod ? `Окупаемость ${object.paybackPeriod} лет.` : '',
        'Инвестиционный объект с расчётом дохода на AREALVEST.',
      ]
        .filter(Boolean)
        .join(' '),
      300,
    );

    const image = object.images && object.images[0] ? object.images[0] : '';

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:image', image);
    }

    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = url;
    canonical.dataset.objectSeo = '1';
    document.head.appendChild(canonical);

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.dataset.objectSeo = '1';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: object.title,
      description,
      category: typeLabel,
      url,
      ...(image ? { image: object.images.slice(0, 5) } : {}),
      ...(object.price
        ? {
            offers: {
              '@type': 'Offer',
              price: object.price,
              priceCurrency: 'RUB',
              url,
              availability:
                object.status === 'available'
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/SoldOut',
            },
          }
        : {}),
    });
    document.head.appendChild(ld);

    return () => {
      document.head
        .querySelectorAll('[data-object-seo="1"]')
        .forEach((el) => el.remove());
    };
  }, [object]);
};

export default useObjectSeo;
