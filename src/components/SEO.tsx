import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Canonical URL */
  canonical?: string;
  /** OG image URL */
  image?: string;
  /** OG type (website, article, profile, etc.) */
  type?: 'website' | 'article' | 'profile' | 'product';
  /** Article published time */
  publishedTime?: string;
  /** Article modified time */
  modifiedTime?: string;
  /** Article tags */
  tags?: string[];
  /** Twitter card type (summary, summary_large_image) */
  twitterCard?: 'summary' | 'summary_large_image';
  /** Additional meta tags */
  additionalMeta?: Array<{ name: string; content: string }>;
  /** Additional link tags */
  additionalLinks?: Array<{ rel: string; href: string; media?: string }>;
  /** JSON-LD structured data */
  structuredData?: any;
}

const defaultTitle = 'UAi - Your Digital AI Twin';
const defaultDescription = 'Create your digital AI twin. Connect with others, explore AI-powered features, and upgrade your experience with premium NFC cards.';
const defaultImage = '/og-image.jpg';
const siteUrl = import.meta.env.VITE_SITE_URL || 'https://uai.example.com';

/**
 * SEO Component - Manages all meta tags, Open Graph, and Twitter Cards
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description = defaultDescription,
  canonical,
  image = defaultImage,
  type = 'website',
  publishedTime,
  modifiedTime,
  tags,
  twitterCard = 'summary_large_image',
  additionalMeta = [],
  additionalLinks = [],
  structuredData,
}) => {
  const fullTitle = title ? `${title} | UAi` : defaultTitle;
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const canonicalUrl = canonical || window.location.origin + window.location.pathname;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="title" content={title || defaultTitle} />
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Keywords (optional, less important for modern SEO) */}
      <meta name="keywords" content="AI, digital twin, artificial intelligence, NFC, profile, social" />
      <meta name="author" content="UAi Team" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || 'UAi - Digital AI Twin'} />
      <meta property="og:site_name" content="UAi" />
      <meta property="og:locale" content="en_US" />

      {/* Article-specific OG tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Profile-specific OG tags */}
      {type === 'profile' && (
        <>
          <meta property="profile:first_name" content="UAi" />
          <meta property="profile:last_name" content="User" />
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:creator" content="@uai_official" />
      <meta name="twitter:site" content="@uai_official" />

      {/* Favicon and Manifest */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#7C3AED" />
      <meta name="msapplication-TileColor" content="#7C3AED" />

      {/* Additional Meta Tags */}
      {additionalMeta.map((meta, index) => (
        <meta key={index} name={meta.name} content={meta.content} />
      ))}

      {/* Additional Links */}
      {additionalLinks.map((link, index) => (
        <link
          key={index}
          rel={link.rel}
          href={link.href}
          media={link.media}
        />
      ))}

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Default Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "UAi",
          "url": siteUrl,
          "logo": `${siteUrl}/logo.png`,
          "description": defaultDescription,
          "sameAs": [
            "https://twitter.com/uai_official",
            "https://www.facebook.com/uai.official",
            "https://www.instagram.com/uai_official",
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "support@uai.example.com"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
