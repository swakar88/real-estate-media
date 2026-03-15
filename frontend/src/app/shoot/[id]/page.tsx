"use client";

import { useState, useEffect } from "react";
import { 
  Camera, 
  Video as VideoIcon, 
  MapPin, 
  Download, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  BedDouble,
  Bath,
  Maximize,
  Clock,
  FileDown,
  Monitor,
  Smartphone
} from "lucide-react";
import { useParams } from "next/navigation";

interface MediaItem {
  id: string | number;
  media_type: 'photo' | 'video' | 'virtual_tour';
  url: string;
  watermarked_url?: string;
  is_processed: boolean;
}

export default function PropertyPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [shoot, setShoot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"photos" | "video" | "tour">("photos");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/${id}/public-view/`);
      if (res.ok) {
        const data = await res.json();
        setShoot(data);
      } else {
        setError("Property not found or access restricted.");
      }
    } catch (err) {
      console.error("Error fetching property:", err);
      setError("An error occurred while loading the property.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get('payment');
    const sessionId = queryParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      const verifyPayment = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/verify-payment/`, {
            method: 'POST',
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ session_id: sessionId })
          });
          
          if (res.ok) {
            // Refresh data to show unlocked status
            fetchProperty();
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('payment');
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url.pathname + url.search);
          }
        } catch (err) {
          console.error("Error verifying payment:", err);
        }
      };
      verifyPayment();
    } else {
      fetchProperty();
    }
  }, [id]);

  const photos: MediaItem[] = shoot?.media_items?.filter((i: MediaItem) => i.media_type === 'photo' && i.url) || [];
  const videos: MediaItem[] = shoot?.media_items?.filter((i: MediaItem) => i.media_type === 'video' && i.url) || [];
  const tours: MediaItem[] = shoot?.media_items?.filter((i: MediaItem) => i.media_type === 'virtual_tour' && i.url) || [];

  const triggerDownload = async (itemId: number, type: string = 'high-res') => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/shoots/${id}/get-download-url/?item_id=${itemId}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        // Force download by creating a temporary link
        const link = document.createElement('a');
        link.href = data.download_url;
        link.setAttribute('download', ''); // The backend sets the filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const downloadAll = async (type: string = 'high-res') => {
    const items = type === 'video' ? videos : photos; // Assuming 'videos' and 'photos' are defined in scope
    for (let i = 0; i < items.length; i++) {
        await triggerDownload(items[i].id as number, type); // Cast id to number
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : 500));
    }
  };

  const getExpiryDate = () => {
    if (!shoot?.shoot_date) return null;
    const date = new Date(shoot.shoot_date);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const expiryDate = getExpiryDate();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!shoot) {
    return (
       <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center">
             <MapPin className="h-10 w-10 text-white/20" />
          </div>
          <h1 className="text-2xl font-black">Property Not Found</h1>
          <p className="text-white/40 max-w-md">This link may have expired or the property is no longer available.</p>
       </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Expiry Notification */}
      {shoot.payment_status === 'paid' && expiryDate && (
        <div className="bg-primary/20 border-b border-primary/20 py-2.5 px-6 text-center animate-in fade-in slide-in-from-top duration-700 relative z-[60]">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] text-primary flex items-center justify-center gap-3">
            <Clock className="w-3.5 h-3.5" />
            Media stored until {expiryDate} (30 days remaining)
          </p>
        </div>
      )}

      {/* Header / Navigation */}
      <nav className={`fixed ${shoot.payment_status === 'paid' ? 'top-[42px]' : 'top-0'} left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 py-4`}>
         <div className="max-w-[1800px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
               <h1 className="text-xl font-black tracking-tighter hover:text-primary transition-colors cursor-pointer flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm">KC</div>
                  <span className="hidden sm:inline">KC<span className="text-primary">.</span>REAL ESTATE MEDIA</span>
               </h1>
            </div>
            
            <div className="hidden lg:flex items-center gap-12 absolute left-1/2 -translate-x-1/2">
               <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Property</span>
                  <span className="text-sm font-bold truncate max-w-[200px]">{shoot.property_address}</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
               {shoot.payment_status === 'paid' ? (
                 <button 
                  onClick={() => setShowDownloadModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all font-black text-xs uppercase tracking-widest active:scale-95"
                 >
                    <Download className="h-4 w-4" /> Download
                 </button>
               ) : (
                 shoot.stripe_payment_link && (
                   <a 
                     href={shoot.stripe_payment_link}
                     target="_blank"
                     className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-500/20 hover:scale-[1.02] transition-all font-black text-xs uppercase tracking-widest active:scale-95"
                   >
                      <CreditCard className="h-4 w-4" /> Buy Now
                   </a>
                 )
               )}
            </div>
         </div>
      </nav>

      <main className="pt-32">
        {/* Info Section */}
        <div className="max-w-[1800px] mx-auto px-6 mb-12">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                 <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{shoot.property_address}</h2>
                 <div className="flex flex-wrap items-center gap-6">
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">{shoot.client_name}</p>
                    <div className="flex items-center gap-4 text-white/20">
                       <span className="w-1 h-1 bg-current rounded-full" />
                       <div className="flex items-center gap-2 text-white/60">
                          <BedDouble className="h-4 w-4" />
                          <span className="text-xs font-bold">{shoot.beds || 4} Beds</span>
                       </div>
                       <span className="w-1 h-1 bg-current rounded-full" />
                       <div className="flex items-center gap-2 text-white/60">
                          <Bath className="h-4 w-4" />
                          <span className="text-xs font-bold">{shoot.baths || 3} Baths</span>
                       </div>
                       <span className="w-1 h-1 bg-current rounded-full" />
                       <div className="flex items-center gap-2 text-white/60">
                          <Maximize className="h-4 w-4" />
                          <span className="text-xs font-bold">{(shoot.sqft || 2800).toLocaleString()} SqFt</span>
                       </div>
                    </div>
                 </div>
              </div>
              
              {shoot.property_price && (
                 <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-right">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Listing Price</p>
                    <p className="text-3xl font-black text-primary">${parseFloat(shoot.property_price).toLocaleString()}</p>
                 </div>
              )}
           </div>
        </div>

        {/* Media Tabs */}
        <div className="max-w-[1800px] mx-auto px-6 mb-12">
            <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-3xl w-fit border border-white/5">
               <button 
                 onClick={() => setActiveTab('photos')}
                 className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'photos' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
               >
                  Photos
               </button>
               <button 
                 onClick={() => setActiveTab('video')}
                 className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'video' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
               >
                  Video
               </button>
               <button 
                 onClick={() => setActiveTab('tour')}
                 className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'tour' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
               >
                  3D Tour
               </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-20 max-w-[1800px] mx-auto min-h-[50vh]">
            {activeTab === 'photos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-10 duration-700">
                 {photos.map((item, idx) => (
                   <div 
                     key={item.id} 
                     className="aspect-[3/2] bg-white/5 rounded-[2rem] overflow-hidden group cursor-pointer relative border border-white/5"
                     onClick={() => setSelectedImage(idx)}
                   >
                     <img 
                       src={item.watermarked_url || item.url} 
                       alt="" 
                       className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                       onContextMenu={(e) => e.preventDefault()}
                       draggable="false"
                     />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="h-8 w-8 text-white scale-75 group-hover:scale-100 transition-transform duration-500" />
                     </div>
                   </div>
                 ))}
              </div>
            )}

            {activeTab === 'video' && (
              <div className="aspect-video w-full bg-white/5 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative group">
                 {videos[0] ? (
                   <>
                     {videos[0].url.includes('.mp4') || videos[0].url.includes('.mov') || videos[0].url.includes('upload') ? (
                       <video 
                         src={videos[0].watermarked_url || videos[0].url} 
                         className="w-full h-full object-cover"
                         controls
                         controlsList="nodownload"
                         onContextMenu={(e) => e.preventDefault()}
                         autoPlay
                         muted
                         loop
                       />
                     ) : (
                       <iframe 
                         src={videos[0].url} 
                         className="w-full h-full" 
                         allowFullScreen 
                       />
                     )}
                     
                     {!videos[0].is_processed && (
                       <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                         <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-[10px] font-bold text-white uppercase tracking-widest">Optimizing for Web...</p>
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                      <Play className="h-20 w-20 text-white/10" />
                      <p className="text-white/40 font-bold uppercase tracking-widest">Video not available</p>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'tour' && (
              <div className="aspect-video w-full bg-white/5 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                 {tours[0] ? (
                   <iframe 
                     src={tours[0].url} 
                     className="w-full h-full" 
                     allowFullScreen 
                   />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                      <ExternalLink className="h-20 w-20 text-white/10" />
                      <p className="text-white/40 font-bold uppercase tracking-widest">3D Tour not available</p>
                   </div>
                 )}
              </div>
            )}
        </div>
      </main>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 z-[140] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
           <button 
             onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
             className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white active:scale-90 z-[150]"
           >
              <X className="h-8 w-8 text-white" />
           </button>
           
           <div 
             className="relative w-full h-full max-h-[85vh] flex items-center justify-center cursor-default"
             onClick={(e) => e.stopPropagation()}
           >
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev! > 0 ? prev! - 1 : photos.length - 1); }}
                className="absolute left-0 p-6 text-white/40 hover:text-white transition-all active:-translate-x-2"
              >
                 <ChevronLeft className="h-12 w-12" />
              </button>
              
              <img 
                src={shoot.payment_status === 'paid' ? photos[selectedImage].url : (photos[selectedImage].watermarked_url || photos[selectedImage].url)} 
                alt="" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onContextMenu={(e) => e.preventDefault()}
                draggable="false"
              />
              
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev! < photos.length - 1 ? prev! + 1 : 0); }}
                className="absolute right-0 p-6 text-white/40 hover:text-white transition-all active:translate-x-2"
              >
                 <ChevronRight className="h-12 w-12" />
              </button>
           </div>
           
           <div 
             className="mt-8 flex items-center gap-4 overflow-x-auto max-w-4xl no-scrollbar px-10 relative z-[150] cursor-default"
             onClick={(e) => e.stopPropagation()}
           >
              {photos.map((item, idx) => (
                <div 
                  key={item.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                  className={`h-16 w-24 rounded-xl overflow-hidden cursor-pointer transition-all shrink-0 border-2 ${selectedImage === idx ? 'border-primary scale-110 shadow-lg shadow-primary/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img 
                    src={item.url} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                  />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDownloadModal(false)} />
           <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 md:p-12">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h3 className="text-3xl font-black tracking-tighter mb-2">Download Assets</h3>
                       <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Commercial high-resolution media</p>
                    </div>
                    <button onClick={() => setShowDownloadModal(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                       <X className="w-6 h-6" />
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* High Res Photos */}
                    <div className="group bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-primary transition-all duration-500 cursor-pointer relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-700">
                          <CheckCircle2 className="w-20 h-20" />
                       </div>
                       <div className="relative z-10">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                             <FileDown className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl font-bold mb-1">High Resolution</h4>
                          <p className="text-white/40 group-hover:text-white/80 text-xs font-medium mb-6">Original quality for print & large displays</p>
                          <button 
                            onClick={() => downloadAll('high-res')}
                            className="w-full py-4 bg-white/10 group-hover:bg-white text-xs font-black uppercase tracking-widest rounded-2xl group-hover:text-primary transition-all active:scale-95"
                          >
                             Download All
                          </button>
                       </div>
                    </div>

                    {/* Web Optimized */}
                    <div className="group bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white transition-all duration-500 cursor-pointer relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-150 transition-transform duration-700">
                          <Smartphone className="w-20 h-20 text-black" />
                       </div>
                       <div className="relative z-10">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-black/5 transition-colors">
                             <Monitor className="w-6 h-6 group-hover:text-black" />
                          </div>
                          <h4 className="text-xl font-bold mb-1 group-hover:text-black">Web Optimized</h4>
                          <p className="text-white/40 group-hover:text-black/60 text-xs font-medium mb-6">Perfect for Zillow, MLS & Social Media</p>
                          <button 
                            onClick={() => downloadAll('optimized')}
                            className="w-full py-4 bg-white/10 group-hover:bg-black text-xs font-black uppercase tracking-widest rounded-2xl text-white transition-all active:scale-95"
                          >
                             Download All
                          </button>
                       </div>
                    </div>

                    {/* Videos */}
                    {videos.length > 0 && (
                      <div className="md:col-span-2 group bg-primary/20 border border-primary/20 p-8 rounded-[2.5rem] hover:bg-primary transition-all duration-500 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-6">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                               <VideoIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                               <h4 className="text-xl font-bold mb-1">Property Video</h4>
                               <p className="text-white/40 group-hover:text-white/80 text-xs font-medium">Download the high-quality edited video</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => window.open(videos[0].url, '_blank')}
                           className="w-full sm:w-auto px-8 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/20 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                         >
                            Download
                         </button>
                      </div>
                    )}
                 </div>

                 <div className="mt-12 pt-8 border-t border-white/5 flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                       Important: Media is stored for 30 days. Please ensure you have backed up all files before the deletion date: <span className="text-primary font-black">{expiryDate}</span>.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="py-20 border-t border-white/5 bg-black/40">
        <div className="max-w-[1800px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="space-y-4">
              <h4 className="font-black text-xs uppercase tracking-widest text-white/60">The Property</h4>
              <p className="text-xl font-bold max-w-xs leading-tight">{shoot.property_address}</p>
           </div>
           <div className="space-y-4">
              <h4 className="font-black text-xs uppercase tracking-widest text-white/60">Quick Links</h4>
              <nav className="flex flex-col gap-2">
                 <button onClick={() => setActiveTab('photos')} className="text-left text-sm text-white/40 hover:text-primary transition-colors">Photos</button>
                 <button onClick={() => setActiveTab('video')} className="text-left text-sm text-white/40 hover:text-primary transition-colors">Video</button>
                 <button onClick={() => setActiveTab('tour')} className="text-left text-sm text-white/40 hover:text-primary transition-colors">3D Tour</button>
              </nav>
           </div>
           <div className="space-y-6">
              <h4 className="font-black text-xs uppercase tracking-widest text-white/60">Contact</h4>
              <p className="text-sm text-white/40">For questions regarding your media or to schedule another shoot, please contact your photographer.</p>
              <div className="pt-4 border-t border-white/5">
                 <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">KC REAL ESTATE MEDIA</p>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
