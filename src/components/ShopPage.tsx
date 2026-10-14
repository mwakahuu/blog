import React, { useState } from 'react';
import type { Post, ShopProduct } from '../types';
import { Sidebar } from './Sidebar';

interface ShopPageProps {
  onNavigateHome: () => void;
  products: ShopProduct[];
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSearch: (query: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  posts,
  onSelectPost,
  onSearch,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [activeImage, setActiveImage] = useState('');

  const openProduct = (product: ShopProduct) => {
    setSelectedProduct(product);
    setActiveImage(product.image);
  };

  const handleAgiza = (product: ShopProduct) => {
    const options = product.features.length ? `\nChaguo: ${product.features.join(', ')}` : '';
    const message = `Habari, nahitaji kuagiza: ${product.title} (Bei: ${product.priceLabel})${options}`;
    const whatsappUrl = `https://wa.me/255623709042?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="catalog-page max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8">
          <div className="catalog-panel mb-5">
            <h1 className="catalog-panel-heading">Duka la Raha</h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Bei zote ni kwa Shilingi za Tanzania (TSh). Chagua bidhaa kuona maelezo zaidi.
              </p>
              <a
                href="https://wa.me/255623709042?text=Habari,%20nahitaji%20maelezo%20kuhusu%20bidhaa%20za%20dukani"
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide px-4 py-2.5 transition-colors shadow-sm self-start shrink-0"
              >
                WhatsApp Help
              </a>
            </div>
          </div>

          <div className="catalog-items-grid">
            {products.map((product) => {
              const productVideos = product.videoUrls?.length
                ? product.videoUrls
                : product.videoUrl ? [product.videoUrl] : [];

              return (
                <article
                  key={product.id}
                  className="catalog-item-card group"
                >
                  <button
                  type="button"
                  onClick={() => openProduct(product)}
                  className="catalog-item-image"
                  aria-label={`Tazama picha na maelezo ya ${product.title}`}
                  >
                  <img
                    src={product.image}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {productVideos.length > 0 && (
                    <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] px-1.5 py-1">
                      Ina video
                    </span>
                  )}
                  </button>

                  <div className="catalog-item-content">
                  <button
                    type="button"
                    onClick={() => openProduct(product)}
                    className="catalog-item-title"
                  >
                    {product.title}
                  </button>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                    {product.description}
                  </p>
                  <div className="catalog-item-footer">
                    <span className="catalog-price">{product.priceLabel}</span>
                    <button
                      type="button"
                      onClick={() => handleAgiza(product)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wide px-2.5 py-1.5 transition-colors cursor-pointer shrink-0"
                      title="Agiza kupitia WhatsApp 0623709042"
                    >
                      Agiza
                    </button>
                  </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="lg:col-span-4">
          <Sidebar
            posts={posts}
            onSelectPost={onSelectPost}
            onSearch={onSearch}
            compact
          />
        </div>
      </div>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-4xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              aria-label="Funga maelezo ya bidhaa"
              className="absolute top-4 right-4 z-10 text-slate-500 hover:text-slate-900 text-xl cursor-pointer"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={activeImage}
                    alt={selectedProduct.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
                  {selectedProduct.images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      aria-label={`Tazama picha ${index + 1}`}
                      aria-pressed={activeImage === image}
                      className={`aspect-square overflow-hidden border ${activeImage === image ? 'border-emerald-600' : 'border-slate-200'}`}
                    >
                      <img
                        src={image}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                {(selectedProduct.videoUrls?.length
                  ? selectedProduct.videoUrls
                  : selectedProduct.videoUrl ? [selectedProduct.videoUrl] : []
                ).map((videoUrl, index) => (
                  <video
                    key={`${videoUrl}-${index}`}
                    src={videoUrl}
                    controls
                    preload="metadata"
                    className="w-full mt-4 bg-black"
                    aria-label={`Video ya ${selectedProduct.title}`}
                  >
                    Kivinjari chako hakiwezi kucheza video hii.
                  </video>
                ))}
              </div>

              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-slate-900 font-condensed mt-1 mb-3 pr-8">
                  {selectedProduct.title}
                </h2>
                <span className="text-2xl font-extrabold text-slate-900 font-condensed mb-1">
                  {selectedProduct.priceLabel}
                </span>
                <span className="text-xs font-semibold text-emerald-700 mb-4">
                  Bei kwa Shilingi za Tanzania (TSh)
                </span>
                <p className="text-base font-medium text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                  {selectedProduct.description}
                </p>
                {selectedProduct.features.length > 0 && (
                  <>
                    <h3 className="text-xs font-bold uppercase text-slate-800 mb-2 font-condensed">
                      Chaguo na bei
                    </h3>
                    <ul className="text-sm font-medium text-slate-700 space-y-1.5 mb-6">
                      {selectedProduct.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleAgiza(selectedProduct)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 transition-colors cursor-pointer mt-auto"
                >
                  AGIZA SASA · {selectedProduct.priceLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};