import React from 'react';
import { MapPin, Bed, Bath, Maximize, Heart } from 'lucide-react';

export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  area: number;
  imageUrl: string;
  type: string;
}

export const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-md hover:shadow-lg transition group dir-rtl">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={property.imageUrl} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <span className="absolute top-3 right-3 bg-primary text-white text-xs px-2.5 py-1 rounded-full font-medium">
          {property.type}
        </span>
        <button className="absolute top-3 left-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 transition">
          <Heart className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{property.title}</h3>
        <p className="text-gray-500 text-sm flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          {property.location}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-gray-600 text-xs">
          <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.beds} غرف</span>
          <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.baths} حمام</span>
          <span className="flex items-center gap-1"><Maximize className="w-4 h-4" /> {property.area} م²</span>
        </div>

        <div className="pt-2 flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-400">السعر</span>
            <p className="text-primary font-bold text-lg">{property.price.toLocaleString()} <span className="text-xs">ر.س</span></p>
          </div>
          <button className="text-xs font-semibold text-primary hover:underline">عرض التفاصيل</button>
        </div>
      </div>
    </div>
  );
};
