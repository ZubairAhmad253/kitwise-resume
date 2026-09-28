// Change the name here and it updates everywhere: header, footer, page
// titles, structured data and Open Graph tags.
export const SITE = {
  /** This site's name: the resume builder in the Kitwise family. */
  name: 'Kitwise Resume',
  /** The family brand shared with the other Kitwise sites. */
  brand: 'Kitwise',
  tagline: 'Free resume builder with modern templates',
  description:
    'Kitwise Resume: a free resume builder with modern, ATS-friendly templates. Fill in your details and download a print-ready PDF in A4 or US Letter. No sign-up.',
  locale: 'en',
  /** Default image for link previews (1200 × 630). */
  ogImage: '/og-image.jpg',
  /** Square logo for search engines (structured data). */
  logo: '/icon-512.png',
  /** Placeholder until the domain is bought: shown on the contact and legal pages. */
  email: 'hello@example.com',
} as const;

export const ADSENSE_CLIENT = import.meta.env.PUBLIC_ADSENSE_CLIENT ?? '';
