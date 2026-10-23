export interface CatalogEditorialInterludeProps {
  onSelectFeaturedCategory?: (categoryId: string) => void;
}

export default function CatalogEditorialInterlude({
  onSelectFeaturedCategory,
}: CatalogEditorialInterludeProps) {
  return (
    <aside className="catalog-interlude" aria-label="Filosofía de curaduría Bella Forever">
      <div className="catalog-interlude__top">
        <span className="catalog-pill-tag">Nuestra Filosofía</span>

        <div className="catalog-interlude__thumbs">
          <div className="catalog-interlude__thumb">
            <img
              src="/images/studio-soda-pop-kit.webp"
              alt="Texturas de brillo labial Bella Forever"
              width="88"
              height="88"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="catalog-interlude__thumb">
            <img
              src="/images/studio-lip-plump-pose.webp"
              alt="Aplicación de labial hidratante en piel real"
              width="88"
              height="88"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>

      <p className="catalog-interlude__statement">
        En Bella Forever seleccionamos cada fórmula pensando en{' '}
        <span className="catalog-interlude__serif-em">piel real y alto brillo.</span>{' '}
        Pigmentos sedosos que se difuminan sin esfuerzo para que tu rutina diaria se sienta{' '}
        <span className="catalog-interlude__serif-em">sofisticada, radiante y auténtica.</span>
      </p>

      {onSelectFeaturedCategory && (
        <div>
          <button
            type="button"
            onClick={() => onSelectFeaturedCategory('labiales')}
            className="editorial-pill-btn editorial-pill-btn--alabaster"
          >
            Explorar Labiales
          </button>
        </div>
      )}
    </aside>
  );
}
