"use client";

import { useState, useEffect } from "react";
import { Save, Package as PackageIcon, DollarSign, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Layout, List } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

interface Service {
    id: number;
    title: string;
    description: string;
    category: string;
    price: string | number;
    is_active: boolean;
}

interface Package {
    id: number;
    name: string;
    price: string | number;
    description: string;
    features: string[];
    is_popular: boolean;
    order: number;
}

export default function PricingManagementPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'packages' | 'add-ons'>('packages');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log("Fetching pricing data from:", process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");
            const [servicesRes, packagesRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/services/`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/packages/`)
            ]);
            
            console.log("Services status:", servicesRes.status);
            console.log("Packages status:", packagesRes.status);

            if (servicesRes.ok && packagesRes.ok) {
                const servicesData = await servicesRes.json();
                const packagesData = await packagesRes.json();
                
                const svcs = servicesData.results || servicesData;
                const pkgs = packagesData.results || packagesData;
                
                console.log("Fetched services count:", svcs.length);
                console.log("Service categories:", svcs.map((s: any) => s.category));
                console.log("Fetched packages count:", pkgs.length);
                
                setServices(svcs);
                setPackages(pkgs);
            } else {
                console.error("Failed to fetch. Services OK:", servicesRes.ok, "Packages OK:", packagesRes.ok);
            }
        } catch (err) {
            console.error("Error fetching pricing data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePackage = async (pkg: Package) => {
        setSaving(`pkg_${pkg.id}`);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/packages/${pkg.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(pkg)
            });
            if (res.ok) {
               // Success feedback
            }
        } catch (err) {
            console.error("Error saving package:", err);
        } finally {
            setSaving(null);
        }
    };

    const handleSaveService = async (service: Service) => {
        setSaving(`svc_${service.id}`);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/services/${service.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(service)
            });
            if (res.ok) {
                // Success feedback
            }
        } catch (err) {
            console.error("Error saving service:", err);
        } finally {
            setSaving(null);
        }
    };

    const updatePackageField = (id: number, field: string, value: any) => {
        setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const updateServiceField = (id: number, field: string, value: any) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <ScrollReveal>
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold mb-2 tracking-tight italic">Pricing & <span className="text-primary italic">Packages Manager</span></h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Central control for all service rates and package configurations. Changes here are applied instantly to the public site.
                    </p>
                </div>
            </ScrollReveal>

            {/* Tabs & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex gap-4 p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-primary/10 w-fit">
                    <button 
                        type="button"
                        onClick={() => { console.log("Switching to packages"); setActiveTab('packages'); }}
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'packages' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                    >
                        <PackageIcon className="w-3 h-3" /> Packages
                    </button>
                    <button 
                        type="button"
                        onClick={() => { console.log("Switching to add-ons"); setActiveTab('add-ons'); }}
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'add-ons' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                    >
                        <Layout className="w-3 h-3" /> Add-On Services
                    </button>
                </div>

                <button 
                    type="button"
                    onClick={fetchData}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all flex items-center gap-2"
                >
                    <Plus className="w-3 h-3 rotate-45" /> Refresh Data
                </button>
            </div>

            {activeTab === 'packages' ? (
                <StaggerContainer key="packages-grid" className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {packages.map(pkg => (
                        <StaggerItem key={pkg.id}>
                            <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-[2.5rem] p-8 space-y-6 flex flex-col h-full shadow-gold hover:shadow-gold-heavy transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
                                            <List className="w-3 h-3" /> Package Name
                                        </div>
                                        <input 
                                            type="text" 
                                            value={pkg.name} 
                                            onChange={(e) => updatePackageField(pkg.id, 'name', e.target.value)}
                                            className="text-2xl font-black text-white italic bg-transparent border-none outline-none focus:text-primary transition-colors block w-full" 
                                        />
                                    </div>
                                    <div className="bg-primary/5 border border-primary/20 px-6 py-3 rounded-2xl text-center">
                                        <label className="block text-[8px] font-black uppercase tracking-widest text-primary mb-1">Price ($)</label>
                                        <input 
                                            type="number" 
                                            value={pkg.price} 
                                            onChange={(e) => updatePackageField(pkg.id, 'price', e.target.value)}
                                            className="text-xl font-black text-primary italic bg-transparent border-none outline-none w-20 text-center" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Included Features (One per line)</label>
                                        {pkg.is_popular && <span className="bg-primary/20 text-primary text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/30">Popular Choice</span>}
                                    </div>
                                    <textarea 
                                        value={pkg.features?.join('\n') || ''}
                                        onChange={(e) => {
                                            const lines = e.target.value.split('\n').filter(line => line.trim() !== '');
                                            updatePackageField(pkg.id, 'features', lines);
                                        }}
                                        className="w-full h-48 bg-black/40 border border-primary/10 rounded-2xl p-6 text-sm focus:border-primary/50 outline-none transition-all text-foreground resize-none font-bold"
                                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3..."
                                    />
                                </div>

                                <button 
                                    onClick={() => handleSavePackage(pkg)}
                                    disabled={saving === `pkg_${pkg.id}`}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 border ${saving === `pkg_${pkg.id}` ? 'bg-primary/20 text-primary border-primary/30 animate-pulse' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-lg shadow-primary/5'}`}
                                >
                                    {saving === `pkg_${pkg.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                    {saving === `pkg_${pkg.id}` ? 'Updating...' : 'Apply Changes'}
                                </button>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            ) : (
                <StaggerContainer key="add-ons-list" className="space-y-4">
                    {services.filter(s => {
                        const cat = (s.category || '').toLowerCase();
                        return cat === 'add_on' || cat === 'add-on';
                    }).map(service => (
                        <StaggerItem key={service.id}>
                            <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-gold hover:shadow-gold-heavy transition-all">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Service Title</label>
                                    <input 
                                        type="text" 
                                        value={service.title} 
                                        onChange={(e) => updateServiceField(service.id, 'title', e.target.value)}
                                        className="text-lg font-black text-white italic bg-transparent border-none outline-none focus:text-primary transition-colors block w-full" 
                                    />
                                </div>
                                
                                <div className="bg-primary/5 border border-primary/10 px-6 py-3 rounded-2xl flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Base Price:</span>
                                    <div className="flex items-center">
                                        <span className="text-primary font-black italic mr-1 text-sm">$</span>
                                        <input 
                                            type="number" 
                                            value={service.price || 0} 
                                            onChange={(e) => updateServiceField(service.id, 'price', e.target.value)}
                                            className="text-xl font-black text-primary italic bg-transparent border-none outline-none w-16" 
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleSaveService(service)}
                                    disabled={saving === `svc_${service.id}`}
                                    className={`px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 border shrink-0 ${saving === `svc_${service.id}` ? 'bg-primary/20 text-primary border-primary/30' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-lg shadow-primary/5'}`}
                                >
                                    {saving === `svc_${service.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    {saving === `svc_${service.id}` ? 'Saving...' : 'Save Rate'}
                                </button>
                            </div>
                        </StaggerItem>
                    ))}
                    
                    {services.filter(s => {
                        const cat = (s.category || '').toLowerCase();
                        return cat === 'add_on' || cat === 'add-on';
                    }).length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl bg-black/20">
                            <AlertCircle className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white italic mb-2">No Add-Ons Found</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">Ensure your services are categorized as 'add_on' in the main services management section.</p>
                        </div>
                    )}
                </StaggerContainer>
            )}
        </div>
    );
}
