import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background mt-20">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg">KC Real Estate Media</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Virtual media solutions for real estate professionals, business owners, and event coordinators in Kansas City.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/services#editing" className="hover:text-primary transition-colors">Real Estate Photo & Video</Link></li>
              <li><Link href="/services#editing" className="hover:text-primary transition-colors">Business Marketing</Link></li>
              <li><Link href="/services#drone" className="hover:text-primary transition-colors">Drone Photography</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/gallery" className="hover:text-primary transition-colors">Portfolio Gallery</Link></li>
              <li><Link href="/book" className="hover:text-primary transition-colors">Book Online</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Connect With Us</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>14702 W 90th Ter</li>
              <li>Lenexa, KS 66215</li>
              <li><a href="mailto:info@kcrealestatemedia.com" className="hover:text-primary transition-colors">info@kcrealestatemedia.com</a></li>
              <li><a href="tel:9136095811" className="hover:text-primary transition-colors">Tel: 913-609-5811</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} KC Real Estate Media. All rights reserved.</p>
          <p>MO, KS, FL</p>
        </div>
      </div>
    </footer>
  );
}
