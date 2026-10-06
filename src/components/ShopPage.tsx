import React, { useState } from 'react';
import { PRODUCTS, ShopProduct } from '../data/shop';

interface ShopPageProps {
  onNavigateHome: () => void;
}

export const ShopPage: React.FC<ShopPageProps> = () => {
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white p-6 sm:p-10 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-condensed">
            Duka la Raha
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Bei zote zimeonyeshwa kwa Shilingi za Tanzania (TSh). Chagua bidhaa kuona maelezo, picha na video, kisha tuma oda yako kupitia WhatsApp.
          </p>
        </div>
        <a
          href="https://wa.me/255623709042?text=Habari,%20nahitaji%20maelezo%20kuhusu%20bidhaa%20za%20dukani"
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 transition-colors shadow-sm self-start md:self-auto shrink-0"
        >
          WhatsApp Help (0623709042)
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {PRODUCTS.map((product) => (
          <article
            key={product.id}
            className="bg-white border border-slate-200 shadow-xs flex flex-col group overflow-hidden hover:border-slate-300 transition-all"
          >
            <button
              type="button"
              onClick={() => openProduct(product)}
              className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer text-left"
              aria-label={`Tazama picha na maelezo ya ${product.title}`}
            >
              <img
                src={product.image}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {product.videoUrl && (
                <span className="absolute bottom-3 left-3 bg-black/75 text-white text-xs px-2 py-1">
                  Ina video
                </span>
              )}
            </button>

            <div className="p-5 flex-1 flex flex-col">
              <button
                type="button"
                onClick={() => openProduct(product)}
                className="text-left text-base sm:text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors cursor-pointer leading-snug font-condensed mb-2"
              >
                {product.title}
              </button>
              <p className="text-sm sm:text-base font-medium text-slate-700 whitespace-pre-line line-clamp-5 mb-4 leading-relaxed">
                {product.description}
              </p>

              {product.features.length > 0 && (
                <ul className="text-sm font-medium text-slate-700 space-y-1.5 mb-5 border-t border-slate-100 pt-3">
                  {product.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              )}

              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-950 font-condensed">
                    {product.priceLabel}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold block mt-0.5">
                    Bei kwa Shilingi za Tanzania
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAgiza(product)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer rounded-xs shadow-xs shrink-0"
                  title="Agiza kupitia WhatsApp 0623709042"
                >
                  AGIZA
                </button>
              </div>
            </div>
          </article>
        ))}
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
                {selectedProduct.videoUrl && (
                  <video
                    src={selectedProduct.videoUrl}
                    controls
                    preload="metadata"
                    className="w-full mt-4 bg-black"
                    aria-label={`Video ya ${selectedProduct.title}`}
                  >
                    Kivinjari chako hakiwezi kucheza video hii.
                  </video>
                )}
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
