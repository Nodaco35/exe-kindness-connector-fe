'use server';

// import { getAppSetup, getEnv } from '@/constants/appSetup';
// import { sharedMetadata } from '@/constants/appSetup/Metadata';
import { Metadata } from 'next';

// export const fallBackSEO = async ({
//   slug,
//   getDetail,
//   fallbackTitle = 'Chi tiet giai phap - H2Q Solution',
//   fallbackDescription = 'Kham pha cac giai phap phan mem tien tien giup toi uu quy trinh doanh nghiep cung H2Q Solution.',
//   page = `/solutions/detailSolution/${slug}`,
//   type = 'Product',
//   images,
//   imageJsonLd,
//   jsonLd,
//   key = () => [
//     'giai phap phan mem doanh nghiep',
//     'phan mem toi uu quy trinh',
//     'H2Q Solution',
//     'BHS',
//     'Bkav',
//   ],
//   defaultDescription = title =>
//     `Giai phap phan mem ${title} duoc H2Q Solution phat trien de toi uu quy trinh doanh nghiep.`,
// }: {
//   slug: string;
//   getDetail: (slug: string) => any;
//   fallbackTitle?: string;
//   fallbackDescription?: string;
//   page?: string;
//   type?: string;
//   jsonLd?: any;
//   key?: (detail: any) => string[];
//   images?: any;
//   imageJsonLd?: any;
//   defaultDescription?: (title: string) => string;
// }): Promise<Metadata> => {
//   try {
//     const baseMetadata = sharedMetadata();
//     const fallbackImage = getAppSetup()?.logo?.src;
//     const baseUrl = getEnv('NEXT_PUBLIC_SITE_URL') ?? 'https://h2qsolution.com';
//     const pageUrl = `${baseUrl}${page}`;

//     const detailSeo = await Promise.race([
//       getDetail(slug).catch(() => null),
//       new Promise<any | null>(resolve => setTimeout(() => resolve(null), 800)),
//     ]);

//     if (!detailSeo) {
//       void getDetail(slug).catch(error => console.error(error));

//       return {
//         ...baseMetadata,
//         title: fallbackTitle,
//         description: fallbackDescription,
//         openGraph: {
//           title: fallbackTitle,
//           description: fallbackDescription,
//           url: pageUrl,
//           images: [{ url: fallbackImage }],
//         },
//         alternates: { canonical: pageUrl },
//         robots: { index: true, follow: true },
//         other: {
//           'application/ld+json': JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': type,
//             '@id': pageUrl,
//             name: fallbackTitle,
//             description: fallbackDescription,
//             image: fallbackImage,
//             brand: { '@type': 'Organization', name: 'H2Q Solution' },
//           }),
//         },
//       };
//     }

//     const title = detailSeo.PackageName || fallbackTitle;
//     const description = detailSeo.Summary || defaultDescription(title);

//     const imageSEO = Array.isArray(detailSeo.Img) ? images : detailSeo.Img;
//     const imageJsonLdSEO = Array.isArray(detailSeo.Img)
//       ? imageJsonLd
//       : detailSeo.Img;

//     const jsonLdSEO =
//       typeof jsonLd === 'function'
//         ? jsonLd(detailSeo)
//         : {
//             '@context': 'https://schema.org',
//             '@type': type,
//             '@id': pageUrl,
//             name: title,
//             description,
//             imageJsonLdSEO,
//             brand: { '@type': 'Organization', name: 'H2Q Solution' },
//           };

//     return {
//       ...baseMetadata,
//       title,
//       description,
//       keywords: [title, ...key(detailSeo)],
//       openGraph: {
//         title,
//         description,
//         url: pageUrl,
//         type: 'article',
//         images:
//           typeof images === 'function'
//             ? images(detailSeo, baseMetadata)
//             : [{ url: imageSEO, width: 1200, height: 630, alt: title }],
//       },
//       alternates: { canonical: pageUrl },
//       robots: {
//         index: true,
//         follow: true,
//         googleBot: {
//           index: true,
//           follow: true,
//           'max-snippet': -1,
//           'max-image-preview': 'large',
//           'max-video-preview': -1,
//         },
//       },
//       other: {
//         'application/ld+json': JSON.stringify(jsonLdSEO),
//       },
//     };
//   } catch (error) {
//     console.error('[lib_base/fallBackSEO] crashed:', error);

//     return {
//       title: fallbackTitle,
//       description: fallbackDescription,
//       openGraph: {
//         title: fallbackTitle,
//         description: fallbackDescription,
//       },
//       robots: { index: true, follow: true },
//     };
//   }
// };
