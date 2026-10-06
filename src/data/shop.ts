import { Product } from '../types';

export type ShopProduct = Product & {
  priceLabel: string;
  images: string[];
  videoUrl?: string;
};

export const PRODUCTS: ShopProduct[] = [
  {
    id: 'black-dildo-kiboko-ya-nyege',
    title: 'Black Dildo - Kiboko ya Nyege',
    category: 'Adult Toys',
    price: 90000,
    priceLabel: 'TSh 90,000 - 170,000',
    rating: 0,
    reviewsCount: 0,
    description: 'Dildo laini ya silicone inayopatikana kwa ukubwa wa inchi 5 hadi 9. Chagua toleo la kawaida au la umeme kulingana na upendeleo wako.',
    image: 'https://i.ibb.co/kFPy9TG/Whats-App-Image-2026-04-03-at-20-53-13.jpg',
    images: [
      'https://i.ibb.co/kFPy9TG/Whats-App-Image-2026-04-03-at-20-53-13.jpg',
      'https://i.ibb.co/ymdbMhTv/images-1.jpg',
      'https://i.ibb.co/HD1dccLK/Whats-App-Image-2026-04-03-at-20-53-14.jpg',
      'https://i.ibb.co/hR6d2s1d/eldorado-colours-rainbow-pride-dildo-5.webp',
      'https://www.thebadpeach.com/cdn/shop/files/DN-1075.gif',
    ],
    videoUrl: 'https://res.cloudinary.com/dhqfbdotw/video/upload/q_auto/f_auto/v1775244805/WhatsApp_Video_2026-04-03_at_20.53.03_zrwe1i.mp4',
    inStock: true,
    features: ['Sizes: 5 to 9 inches', 'Available electric and regular'],
  },
  {
    id: 'vibrator-all-sizes-colors',
    title: 'Vibrator - Ukubwa na Rangi Mbalimbali',
    category: 'Adult Toys',
    price: 60000,
    priceLabel: 'TSh 60,000 - 120,000',
    rating: 0,
    reviewsCount: 0,
    description: 'Vibrator tulivu yenye mipangilio ya mtetemo na mzunguko kwa wakati mmoja. Inafaa kwa matumizi binafsi au massage; chagua ukubwa na rangi unayopendelea.',
    image: 'https://i.ibb.co/qLhQryVX/Whats-App-Image-2026-04-03-at-20-53-12.jpg',
    images: [
      'https://i.ibb.co/qLhQryVX/Whats-App-Image-2026-04-03-at-20-53-12.jpg',
      'https://www.ricky.com/cdn/shop/articles/wand-vibrator.gif?v=1644854846',
      'https://image.kazanexpress.ru/cmhtk69ivp4onrggp6q0/t_product_high.jpg',
      'https://rukminim2.flixcart.com/image/480/640/xif0q/massager/k/h/r/rechargeable-electric-vibrator-massage-for-female-personal-body-original-imagpfmzg2s3vqhs.jpeg',
      'https://rukminim2.flixcart.com/image/958/958/xif0q/shopsy-massager/t/c/g/vibrate-wand-massager-with-20-magic-vibration-modes-quiet-original-imagfccheh2xyhje.jpeg',
    ],
    videoUrl: 'https://res.cloudinary.com/dhqfbdotw/video/upload/q_auto/f_auto/v1775244745/VID-20260329-WA0050_liz0gz.mp4',
    inStock: true,
    features: [],
  },
  {
    id: 'rose-utamu-mwisho-wa-matatizo',
    title: 'Rose Utamu - Mwisho wa Matatizo',
    category: 'Adult Toys',
    price: 170000,
    priceLabel: 'TSh 170,000',
    rating: 0,
    reviewsCount: 0,
    description: 'Kifaa cha matumizi binafsi chenye umbo la waridi na sehemu ya silicone yenye mtetemo. Muundo wake umeundwa kwa ajili ya kutoa chaguo tofauti za matumizi.',
    image: 'https://i.ibb.co/tyyXtx0/images-Copy.jpg',
    images: [
      'https://i.ibb.co/tyyXtx0/images-Copy.jpg',
      'https://eqomcdn.com/content/photos/products/teazers/75489/1702380058.tea060_7.jpg',
      'https://rosezoe.com/cdn/shop/files/Mouth-Shape-Rose-Toy-With-Dildo-1.gif',
      'https://www.adultscare.com/theme/images/Screenshot_92.png',
    ],
    videoUrl: 'https://res.cloudinary.com/dhqfbdotw/video/upload/q_auto/f_auto/v1775244878/VID-20260329-WA0051_sc0e6c.mp4',
    inStock: true,
    features: [],
  },
  {
    id: 'vipipi-utamu',
    title: 'Vipipi Utamu',
    category: 'Adult Toys',
    price: 5000,
    priceLabel: 'TSh 5,000 - 38,000',
    rating: 0,
    reviewsCount: 0,
    description: 'Vipipi vya ladha vinavyopatikana kwa vifungashio vya ukubwa tofauti. Bei hutegemea kiasi kilichochaguliwa; angalia orodha ya bei hapa chini.\n\nTahadhari: bidhaa hii si njia ya kuzuia mimba. Soma maelekezo ya kifungashio kabla ya matumizi.',
    image: 'https://i.ibb.co/YFCHRpTp/Whats-App-Image-2026-04-03-at-22-08-29-1.jpg',
    images: [
      'https://i.ibb.co/YFCHRpTp/Whats-App-Image-2026-04-03-at-22-08-29-1.jpg',
      'https://i.ibb.co/vCd2Mks5/Whats-App-Image-2026-04-03-at-22-08-29.jpg',
      'https://i.ibb.co/prs7yFGp/Whats-App-Image-2026-04-03-at-22-18-14.jpg',
    ],
    inStock: true,
    features: [
      'Vipipi 10 = TSh 5,000',
      'Vipipi 50 = TSh 8,000',
      'Vipipi 100 = TSh 15,000',
      'Vipipi 200 = TSh 25,000',
      'Kilo 1 = TSh 38,000',
    ],
  },
];
