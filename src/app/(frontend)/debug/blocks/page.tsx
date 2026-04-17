import { Cta } from '@/blocks/cta/Cta';
import { Faq } from '@/blocks/faq/Faq';
import { Gallery } from '@/blocks/gallery/Gallery';
import { Hero } from '@/blocks/hero/Hero';
import { Testimonials } from '@/blocks/testimonials/Testimonials';
import { Video } from '@/blocks/video/Video';

export const dynamic = 'force-dynamic';

export default function DebugBlocksPage() {
  return (
    <>
      <Hero
        blockType="hero"
        variant="default"
        eyebrow="Fabricant français"
        title="Escaliers et accès industriels"
        subtitle="20 ans d'expertise au service de la sécurité en hauteur. Conforme NF E85-015, NF EN 1090, EN ISO 14122."
        cta={{ label: 'Voir le catalogue', href: '/produits' }}
        image={null}
      />
      <Hero
        blockType="hero"
        variant="split"
        eyebrow="Variant Split"
        title="Hero split avec texte à gauche"
        subtitle="Layout alternatif pour les pages catégorie."
        cta={{ label: 'En savoir plus', href: '#' }}
        image={null}
      />
      <Hero
        blockType="hero"
        variant="minimal"
        eyebrow="Variant Minimal"
        title="Hero minimal centré"
        subtitle="Pour les pages secondaires."
        cta={{ label: 'Action', href: '#' }}
        image={null}
      />
      <Cta
        blockType="cta"
        variant="dark"
        heading="Demandez un devis"
        body="Nos équipes répondent sous 24h avec un chiffrage personnalisé."
        primary={{ label: 'Devis gratuit', href: '/contact' }}
        secondary={{ label: 'Appeler', href: 'tel:+33...' }}
      />
      <Faq
        blockType="faq"
        heading="Questions fréquentes"
        intro="Les réponses aux questions les plus courantes sur nos produits."
        items={[
          {
            question: 'Quelle charge admissible pour une échelle à crinoline ?',
            answer:
              'Selon EN ISO 14122-4, la charge admissible minimale est de 150 kg par échelon avec un facteur de sécurité de 5.',
          },
          {
            question: 'Vos escaliers sont-ils conformes CE ?',
            answer: 'Tous nos escaliers industriels sont marqués CE et conformes NF EN 1090.',
          },
        ]}
      />
      <Testimonials
        blockType="testimonials"
        heading="Ils nous font confiance"
        items={[
          {
            quote: 'Installation rapide, produit solide, service impeccable.',
            author: 'Jean Dupont',
            role: 'Responsable maintenance',
            company: 'Usine Chimique SA',
          },
          {
            quote: 'Conformité normative parfaite, aucun défaut à signaler.',
            author: 'Marie Martin',
            role: 'Chargée HSE',
            company: 'Groupe Industriel BTP',
          },
        ]}
      />
      <Gallery blockType="gallery" heading="Galerie" columns="3" images={[]} />
      <Video
        blockType="video"
        heading="Démonstration produit"
        provider="youtube"
        videoId="dQw4w9WgXcQ"
        caption="Installation d'un escalier industriel sur site client."
      />
    </>
  );
}
