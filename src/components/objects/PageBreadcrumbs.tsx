import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const SITE = 'https://xn--80aagkc8a6anj.xn--p1ai';

export interface Crumb {
  name: string;
  path?: string;
}

interface PageBreadcrumbsProps {
  items: Crumb[];
}

const PageBreadcrumbs = ({ items }: PageBreadcrumbsProps) => {
  const key = items.map((i) => `${i.name}|${i.path ?? ''}`).join('>');

  useEffect(() => {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.dataset.breadcrumbSeo = '1';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(item.path ? { item: `${SITE}${item.path}` } : {}),
      })),
    });
    document.head.appendChild(ld);
    return () => ld.remove();
  }, [key]);

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={`${item.name}-${index}`} className="contents">
              <BreadcrumbItem>
                {isLast || !item.path ? (
                  <BreadcrumbPage className="max-w-[220px] truncate sm:max-w-md">{item.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.path}>{item.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default PageBreadcrumbs;
