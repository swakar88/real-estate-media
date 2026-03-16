"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";
import ImageComparison from "@/components/ImageComparison";
import { CheckCircle2, DollarSign, ArrowRight } from "lucide-react";

interface SiteMedia {
    [key: string]: any;
}

export default function AddOnServices() {
    const [media, setMedia] = useState<SiteMedia>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMedia() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/site-media/?view=dict`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setMedia(data);
                }
            } catch (err) {
                console.error("Error fetching media:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchMedia();
    }, []);

    const services = [
        {
            id: 'dusk',
            key: 'services_dusk',
            title: 'Twilight',
            description: '"Transform standard daytime exterior photos into stunning, high-end twilight imagery. Perfect for catching the eye of luxury buyers."',
            category: 'Architectural',
            icon: 'Twilight',
            price: '10.00',
            turnaround: '24 Hours'
        },
        {
            id: 'staging',
            key: 'services_staging',
            title: 'Virtual de-clutter/staging',
            description: '"Digitally remove unwanted furniture or add premium staging to empty rooms. Create a showroom-quality look for every room."',
            category: 'Interior Optimization',
            icon: 'Interior',
            price: '10.00',
            turnaround: '24 Hours'
        },
        {
            id: 'grass',
            key: 'services_grass',
            title: 'Lush Grass',
            description: '"Enhance patchy or brown lawns to a vibrant, lush green. Ensure the property looks its absolute best regardless of the season."',
            category: 'Curb Appeal',
            icon: 'Lawn',
            price: '10.00',
            turnaround: '24 Hours'
        }
    ];

    return (
        <div className="flex min-h-screen flex-col bg-black">
            <Navbar />
            
            <main className="flex-1">
                {/* Header */}
                <section className="relative py-24 md:py-32 overflow-hidden">
                    <div className="absolute inset-0 bg-gold-gradient opacity-5"></div>
                    <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
                        <ScrollReveal>
                            <span className="text-primary font-black text-xs uppercase tracking-[0.4em] block mb-4">Premium Enhancements</span>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 italic">
                                Add-On <span className="text-primary">Services</span>
                            </h1>
                        </ScrollReveal>
                        <ScrollReveal delay={0.2} className="max-w-2xl mx-auto">
                            <p className="text-xl text-muted-foreground leading-relaxed font-light">
                                Professional-grade post-production for individual asset perfection. 
                                <span className="block mt-2 font-bold text-white italic">Flat Rate: $10 per image enhancement.</span>
                            </p>
                        </ScrollReveal>
                    </div>
                </section>

                {/* Vertical Services List */}
                <section className="py-20">
                    <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                        <div className="space-y-32">
                            {services.map((service, index) => (
                                <ScrollReveal key={service.id} direction={index % 2 === 0 ? 'left' : 'right'}>
                                    <div className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}>
                                        {/* Image/Slider Side */}
                                        <div className="flex-1 w-full aspect-[16/10] relative rounded-[2.5rem] overflow-hidden border border-primary/20 shadow-gold group bg-black">
                                            {media[`${service.key}_before`] && media[service.key] ? (
                                                <ImageComparison 
                                                    beforeImage={media[`${service.key}_before`]}
                                                    afterImage={media[service.key]}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-black/40 flex items-center justify-center text-muted-foreground animate-pulse">
                                                    <span className="text-[10px] uppercase tracking-widest font-black italic">Loading Gallery Media...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Side */}
                                        <div className="flex-1 space-y-8">
                                            <div className="space-y-4">
                                                <span className="text-primary font-black text-xs uppercase tracking-[0.3em] block">
                                                    {service.category}
                                                </span>
                                                <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tight">
                                                    {service.title.split(' & ')[0]} 
                                                    {service.title.includes(' & ') && <span className="text-primary italic"> & {service.title.split(' & ')[1]}</span>}
                                                </h2>
                                                <p className="text-lg text-muted-foreground leading-relaxed font-light italic">
                                                    "{service.description}"
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-4">
                                                <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-xl">
                                                    <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Service Rate</span>
                                                    <span className="text-2xl font-black text-primary italic">$10.00</span>
                                                    <span className="text-[10px] text-muted-foreground ml-2">/ image</span>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-xl">
                                                    <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Turnaround</span>
                                                    <span className="text-2xl font-black text-white italic">24 Hours</span>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <Link 
                                                    href="/book" 
                                                    className="inline-flex items-center gap-4 bg-primary text-black px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-white transition-all group overflow-hidden relative shadow-lg shadow-primary/20"
                                                >
                                                    <span className="relative z-10 flex items-center gap-3">
                                                       Book This Enhancement <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                                    </span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5"></div>
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter mb-12">
                            Ready to <span className="text-primary">Perfect</span> Your Listing?
                        </h2>
                        <Link 
                            href="/book" 
                            className="inline-flex items-center gap-8 border-2 border-primary text-primary px-12 py-6 rounded-full font-black uppercase tracking-widest text-sm hover:bg-primary hover:text-black transition-all"
                        >
                            Select Your Package
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
