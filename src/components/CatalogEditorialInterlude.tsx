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
        <span className="catalog-interlude__serif-em">piel real y luz natural.</span>{' '}
        Pigmentos sedosos que se difuminan sin esfuerzo para que tu rutina diaria se sienta{' '}
        <span className="catalog-interlude__serif-em">ligera, fresca y auténtica.</span>
      </p>

      {onSelectFeaturedCategory && (
        <div>
          <button
            type="button"
            onClick={() => onSelectFeaturedCategory('labiales')}
            className="catalog-filter-pill"
            style={{
              borderColor: 'var(--catalog-accent)',
              color: 'var(--catalog-accent)',
              fontWeight: 600,
            }}
          >
            ( Explorar Labiales )
          </button>
        </div>
      )}
    </aside>
  );
}
