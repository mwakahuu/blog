import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, LockKeyhole, Play, Share2, ThumbsUp, X } from 'lucide-react';
import type { VideoItem } from '../types';
import {
  abandonPremiumPayment,
  ApiRequestError,
  createPremiumPayment,
  fetchPremiumAccessStatus,
  fetchPremiumPaymentStatus,
  fetchVideoPlayback,
  type PremiumAccessStatus,
} from '../contentStore';
import { HlsVideoPlayer } from './HlsVideoPlayer';

const getPaymentInitiationMessage = (error: unknown) => {
  if (error instanceof ApiRequestError) {
    if (error.status === 400) return 'Namba ya simu si sahihi. Jaribu namba nyingine.';
    if (error.status === 429) return 'Umejaribu mara nyingi. Subiri kidogo kisha ujaribu tena.';
    if (error.status === 503 && /not configured|not been confirmed|delivery/i.test(error.message)) {
      return 'Malipo hayapatikani kwa sasa. Tafadhali jaribu tena baadaye.';
    }
  }
  return 'Imeshindikana kuanzisha malipo. Jaribu namba nyingine.';
};

interface VideosPageProps {
  videos: VideoItem[];
  initialVideoId?: string;
}

const shuffleVideos = (videos: VideoItem[], excludedId?: string) => {
  const shuffled = videos.filter((video) => video.id !== excludedId);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

export const VideosPage: React.FC<VideosPageProps> = ({
  videos,
  initialVideoId,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(
    videos.find((video) => video.id === initialVideoId) ?? videos[0] ?? null
  );
  const [recommendedVideos, setRecommendedVideos] = useState<VideoItem[]>(
    () => shuffleVideos(videos, initialVideoId ?? videos[0]?.id)
  );
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(() => new Set());
  const [accessStatus, setAccessStatus] = useState<PremiumAccessStatus | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackFormat, setPlaybackFormat] = useState<'hls' | 'file'>('hls');
  const [playbackError, setPlaybackError] = useState('');
  const [playbackRetry, setPlaybackRetry] = useState(0);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentPhase, setPaymentPhase] = useState<'idle' | 'starting' | 'pending' | 'error' | 'success'>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');
  const paymentSubmissionInProgress = useRef(false);
  const isLiked = selectedVideo ? likedVideoIds.has(selectedVideo.id) : false;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.info('[navigation-debug] VideosPage mounted.');
    return () => console.info('[navigation-debug] VideosPage unmounted.');
  }, []);

  useEffect(() => {
    setSelectedVideo((current) => {
      if (!videos.length) return null;
      return videos.find((video) => video.id === (initialVideoId ?? current?.id)) ?? videos[0];
    });
    setRecommendedVideos(shuffleVideos(videos, initialVideoId ?? selectedVideo?.id));
  }, [videos, initialVideoId]);

  useEffect(() => {
    let active = true;
    fetchPremiumAccessStatus().then((status) => {
      if (!active) return;
      setAccessStatus(status);
      if (status.active) setIsPurchaseOpen(false);
      if (status.pendingReference) {
        setPaymentReference(status.pendingReference);
        setPaymentPhase('pending');
        setPaymentMessage('Subiri uthibitisho wa malipo kwenye simu yako.');
      }
    }).catch(() => {
      if (active) setAccessStatus({ active: false, expiresAt: null, pendingReference: null });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isPurchaseOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPurchaseOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isPurchaseOpen]);

  useEffect(() => {
    if (!paymentReference) return;
    let active = true;
    let timer: number | undefined;
    const checkPayment = async () => {
      try {
        const payment = await fetchPremiumPaymentStatus(paymentReference);
        if (!active) return;
        if (import.meta.env.DEV) console.info(`[payment-debug] Provider status: ${payment.status}; accessActive=${payment.accessActive}`);
        if (payment.status === 'completed' && payment.accessActive) {
          setAccessStatus({ active: true, expiresAt: payment.expiresAt, pendingReference: null });
          setPaymentMessage('Malipo yamefanikiwa. Video zote za premium zimefunguliwa kwa saa 5.');
          setPaymentPhase('success');
          setPaymentReference(null);
          return;
        }
        if (payment.status === 'failed' || payment.status === 'cancelled' || payment.status === 'refunded') {
          setPaymentMessage('Malipo hayajathibitishwa. Jaribu namba nyingine.');
          setPaymentPhase('error');
          setPaymentReference(null);
          return;
        }
        setPaymentMessage('Thibitisha ombi la malipo kwenye simu yako. Tunakagua hali ya malipo...');
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiRequestError && [404, 502].includes(error.status)) {
          void abandonPremiumPayment(paymentReference).catch(() => undefined);
          setPaymentReference(null);
          setPaymentPhase('error');
          setPaymentMessage('Ombi halikuthibitishwa. Jaribu namba nyingine.');
          return;
        }
        setPaymentMessage('Bado tunasubiri uthibitisho wa malipo...');
      }
      if (active) timer = window.setTimeout(checkPayment, 4000);
    };
    void checkPayment();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [paymentReference]);

  useEffect(() => {
    if (!selectedVideo) return;
    setPlaybackError('');
    if (!selectedVideo.isPremium && !selectedVideo.videoUrl) {
      setPlaybackUrl(null);
      setPlaybackError('Video source is missing. Update this video from the Admin Panel.');
      return;
    }
    setPlaybackUrl(null);
    if (selectedVideo.isPremium && !accessStatus?.active) return;

    let active = true;
    fetchVideoPlayback(selectedVideo.id)
      .then(({ url, format }) => {
        if (active) {
          setPlaybackUrl(url);
          setPlaybackFormat(format);
        }
      })
      .catch((error: unknown) => {
        if (active) setPlaybackError(error instanceof Error ? error.message : 'Video haipatikani kwa sasa.');
      });
    return () => {
      active = false;
    };
  }, [selectedVideo?.id, selectedVideo?.isPremium, selectedVideo?.videoUrl, accessStatus?.active, playbackRetry]);

  useEffect(() => {
    if (!accessStatus?.active || !accessStatus.expiresAt) return;
    const delay = new Date(accessStatus.expiresAt).getTime() - Date.now();
    const timer = window.setTimeout(() => {
      setAccessStatus((current) => current ? { ...current, active: false } : current);
      setPlaybackUrl(null);
    }, Math.max(0, delay));
    return () => window.clearTimeout(timer);
  }, [accessStatus?.active, accessStatus?.expiresAt]);

  const handleSelectVideo = (video: VideoItem) => {
    const replayingCurrentVideo = selectedVideo?.id === video.id;
    setSelectedVideo(video);
    setRecommendedVideos(shuffleVideos(videos, video.id));
    setPlaybackUrl(null);
    setPlaybackError('');
    if (replayingCurrentVideo) setPlaybackRetry((value) => value + 1);
    if (video.isPremium && !accessStatus?.active) setIsPurchaseOpen(true);
    else setIsPurchaseOpen(false);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleStartPayment = async () => {
    if (paymentSubmissionInProgress.current) return;
    if (!/^0[67]\d{8}$/.test(phone)) {
      setPaymentPhase('error');
      setPaymentMessage('Weka namba sahihi ya simu inayoanza na 06 au 07.');
      return;
    }
    paymentSubmissionInProgress.current = true;
    setPaymentPhase('starting');
    setPaymentMessage('Tunaanzisha ombi la malipo...');
    if (import.meta.env.DEV) console.info('[payment-debug] Pay clicked; starting payment request.');
    try {
      const payment = await createPremiumPayment(phone);
      if (import.meta.env.DEV) console.info('[payment-debug] Payment request accepted; polling for confirmation.');
      setPaymentReference(payment.reference);
      setPaymentPhase('pending');
      setPaymentMessage('Thibitisha ombi la malipo kwenye simu yako.');
    } catch (error) {
      if (import.meta.env.DEV) console.error('[payment-debug] Payment request failed.', error);
      setPaymentPhase('error');
      setPaymentMessage(getPaymentInitiationMessage(error));
    } finally {
      paymentSubmissionInProgress.current = false;
    }
  };

  const handleCancelPayment = (closeModal: boolean) => {
    const reference = paymentReference;
    if (reference) void abandonPremiumPayment(reference).catch(() => undefined);
    setPaymentReference(null);
    setPaymentPhase('idle');
    setPaymentMessage(reference
      ? 'Ombi limeondolewa hapa. Ikiwa bado simu inasubiri, likatae kwenye simu kabla ya kuanzisha jingine.'
      : '');
    setPhone('');
    if (closeModal) setIsPurchaseOpen(false);
  };

  useEffect(() => {
    if (!isPurchaseOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCancelPayment(true);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isPurchaseOpen, paymentReference]);

  const openPurchase = () => {
    setIsPurchaseOpen(true);
    if (paymentPhase === 'success') setPaymentPhase('idle');
    if (paymentPhase === 'error') setPaymentPhase('idle');
  };

  return (
    <div className="catalog-page max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8">
          <div className="catalog-panel mb-5">
            <h1 className="catalog-panel-heading">Chombezo Videos</h1>
          </div>

          {paymentPhase === 'success' && (
            <div className="catalog-video-payment-success mb-5" role="status">
              {paymentMessage}
            </div>
          )}

          {selectedVideo ? <div className="catalog-video-player">
            <div className="catalog-video-frame">
              {selectedVideo.isPremium && !accessStatus?.active ? (
                <div className="catalog-video-locked" style={{ backgroundImage: `linear-gradient(rgb(0 0 0 / 55%), rgb(0 0 0 / 78%)), url("${selectedVideo.thumbnail}")` }}>
                  <LockKeyhole size={36} aria-hidden="true" />
                  <span>{accessStatus?.expiresAt && Date.parse(accessStatus.expiresAt) <= Date.now() ? 'Muda wako wa premium umeisha' : 'Video ya Premium'}</span>
                  <button type="button" onClick={openPurchase}>Lipia kutazama video zote</button>
                </div>
              ) : playbackUrl ? (
                <HlsVideoPlayer key={`${selectedVideo.id}-${playbackRetry}-${playbackUrl}`} src={playbackUrl} title={selectedVideo.title} poster={selectedVideo.thumbnail} mediaType={playbackFormat} />
              ) : playbackError ? (
                <div className="catalog-video-player-message" role="status">
                  <span>{playbackError}</span>
                  <button type="button" onClick={() => setPlaybackRetry((value) => value + 1)}>Jaribu tena</button>
                </div>
              ) : (
                <div className="catalog-video-player-message" role="status">
                  <LoaderCircle className="animate-spin" size={24} aria-label="Inapakia video" />
                </div>
              )}
            </div>
            <div className="catalog-video-info">
              <h2>{selectedVideo.title} {selectedVideo.isPremium && <span className="catalog-video-premium-label">PREMIUM</span>}</h2>
              <div className="catalog-video-toolbar">
                <div className="catalog-video-meta">
                  {selectedVideo.channelName && <span>{selectedVideo.channelName}</span>}
                  {selectedVideo.duration && <span>{selectedVideo.duration}</span>}
                  {selectedVideo.uploadDate && <span>{selectedVideo.uploadDate}</span>}
                </div>
                <div className="catalog-video-actions">
                  <button
                    type="button"
                    className={`catalog-video-action-button ${isLiked ? 'catalog-video-action-liked' : ''}`}
                    aria-label={isLiked ? 'Unlike this video' : 'Like this video'}
                    aria-pressed={isLiked}
                    onClick={() => setLikedVideoIds((current) => {
                      const next = new Set(current);
                      if (next.has(selectedVideo.id)) next.delete(selectedVideo.id);
                      else next.add(selectedVideo.id);
                      return next;
                    })}
                  >
                    <ThumbsUp size={18} aria-hidden="true" />
                    <span>{selectedVideo.likes || 'Like'}</span>
                  </button>
                  <a
                    href={`https://wa.me/255794406730?text=${encodeURIComponent('Tazama video hii: ' + selectedVideo.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="catalog-video-action-button"
                    aria-label={`Share ${selectedVideo.title} on WhatsApp`}
                  >
                    <Share2 size={18} aria-hidden="true" />
                    <span>Share</span>
                  </a>
                </div>
              </div>
              <p className="catalog-video-description">{selectedVideo.description}</p>
            </div>
          </div> : <div className="catalog-video-empty">Hakuna video zilizochapishwa kwa sasa.</div>}

          <div className="catalog-panel mt-5">
            <h2 className="catalog-panel-heading">More Videos</h2>
            <div className="catalog-video-grid p-4">
              {recommendedVideos.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => handleSelectVideo(video)}
                    className="catalog-video-card group"
                  >
                    <span className="catalog-video-thumbnail">
                      <img
                        src={video.thumbnail}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/85 text-white text-[10px] px-1.5 py-1">
                        {video.duration}
                      </span>
                    </span>
                    <span className="catalog-video-card-content">
                      <span className="catalog-video-card-title">{video.title}{video.isPremium && <span className="catalog-video-premium-label">PREMIUM</span>}</span>
                      <span className="catalog-video-card-meta">{video.uploadDate}</span>
                    </span>
                  </button>
              ))}
              {!recommendedVideos.length && (
                <p className="p-4 text-sm text-slate-500">Hakuna video nyingine kwa sasa.</p>
              )}
            </div>
          </div>
        </section>

        <div className="lg:col-span-4">
          <section className="catalog-panel">
            <h2 className="catalog-panel-heading">Video nyingine</h2>
            <div className="flex flex-col divide-y divide-slate-200">
              {recommendedVideos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => handleSelectVideo(video)}
                  className="group flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50"
                  aria-label={`Play video: ${video.title}`}
                >
                  <span className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-slate-900">
                    <img
                      src={video.thumbnail}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                      <Play size={20} fill="currentColor" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-sm font-bold leading-snug text-slate-800 transition-colors group-hover:text-red-600">
                      {video.title}
                      {video.isPremium && <span className="catalog-video-premium-label">PREMIUM</span>}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {video.duration}{video.uploadDate ? ` · ${video.uploadDate}` : ''}
                    </span>
                  </span>
                </button>
              ))}
              {!recommendedVideos.length && (
                <p className="p-4 text-sm text-slate-500">Hakuna video nyingine kwa sasa.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {isPurchaseOpen && selectedVideo?.isPremium && (
        <div className="catalog-video-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) handleCancelPayment(true);
        }}>
          <section className="catalog-video-purchase-modal" role="dialog" aria-modal="true" aria-labelledby="premium-payment-title">
            <button type="button" className="catalog-video-modal-close" aria-label="Funga dirisha la malipo" onClick={() => handleCancelPayment(true)}>
              <X size={20} />
            </button>
            <h2 id="premium-payment-title">Lipia kutazama video zote</h2>
            <p>Video zote za premium, video mpya kila siku</p>
            {paymentPhase === 'pending' ? (
              <>
                <div className="catalog-video-payment-status" role="status">
                  <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
                  <span>{paymentMessage}</span>
                </div>
                <p className="catalog-video-payment-note">Unaweza kufunga dirisha hili. Ili kusitisha ombi la simu, likatae kwenye simu yako.</p>
                <button type="button" className="catalog-video-pending-close" onClick={() => handleCancelPayment(false)}>
                  Ghairi ombi na ujaribu tena
                </button>
              </>
            ) : paymentPhase === 'success' ? (
              <>
                <div className="catalog-video-payment-success" role="status">{paymentMessage}</div>
                <button
                  type="button"
                  className="catalog-video-pending-close"
                  onClick={() => setIsPurchaseOpen(false)}
                >
                  Funga na utazame video zote
                </button>
              </>
            ) : (
              <form
                className="catalog-video-payment-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleStartPayment();
                }}
              >
                <label htmlFor="premium-phone-number">Namba ya simu yenye pesa</label>
                {paymentPhase === 'idle' && paymentMessage && <p className="catalog-video-payment-note" role="status">{paymentMessage}</p>}
                <input
                  id="premium-phone-number"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="06XXXXXXXX au 07XXXXXXXX"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  pattern="0[67][0-9]{8}"
                  title="Weka namba ya simu inayoanza na 06 au 07"
                  disabled={paymentPhase === 'starting'}
                />
                {paymentPhase === 'error' && <p className="catalog-video-payment-error" role="alert">{paymentMessage}</p>}
                <button
                  type="submit"
                  disabled={paymentPhase === 'starting'}
                >
                  {paymentPhase === 'starting' ? <><LoaderCircle className="animate-spin" size={18} /> Inatuma...</> : 'Lipia sasa · TSh 3,000'}
                </button>
              </form>
            )}
            <div className="catalog-payment-methods" aria-label="Tigo Pesa, Vodacom M-Pesa, Airtel Money na Halopesa">
              <img
                src="https://i.ibb.co/bgvzfC11/logo.webp"
                alt="Tigo Pesa, Vodacom M-Pesa, Airtel Money na Halopesa"
                referrerPolicy="no-referrer"
              />
            </div>
            <small>Malipo ya TSh 3,000 yanafungua video zote kwa saa 5. Hakuna akaunti inayohitajika.</small>
          </section>
        </div>
      )}
    </div>
  );
};
