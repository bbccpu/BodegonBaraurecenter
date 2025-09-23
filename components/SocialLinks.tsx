import React from 'react';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../types';

const socialLinks = [
    { name: 'logo-facebook', href: 'https://www.facebook.com/', color: 'hover:text-blue-500', label: 'Facebook' },
    { name: 'logo-whatsapp', href: 'https://wa.me/584226404092', color: 'hover:text-green-500', label: 'WhatsApp' }, // Reemplazar con número real
    { name: 'logo-tiktok', href: 'https://www.tiktok.com/', color: 'hover:text-white', label: 'TikTok' },
    { name: 'logo-instagram', href: 'https://www.instagram.com/', color: 'hover:text-pink-500', label: 'Instagram' },
];

const geoLink = {
    href: 'https://maps.app.goo.gl/t8jJ25Jg8p9ApVVd7',
    logoUrl: 'https://i.imgur.com/yuCfdF2.png',
    alt: 'Geolocalización en Google Maps'
};

export const SocialLinks: React.FC = () => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center space-y-3">
            {socialLinks.map(link => (
                <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-gray-800 bg-opacity-80 backdrop-blur-sm p-3 rounded-full text-gray-300 transition-all duration-300 hover:scale-110 ${link.color} shadow-lg border border-gray-700`}
                    aria-label={link.label}
                >
                    <ion-icon name={link.name} style={{ fontSize: '24px', display: 'block' }}></ion-icon>
                </a>
            ))}
            <a
                href={geoLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border border-gray-700"
                aria-label={geoLink.alt}
            >
                <img src={geoLink.logoUrl} alt={geoLink.alt} className="w-8 h-8 rounded-full" />
            </a>
        </div>
    );
};