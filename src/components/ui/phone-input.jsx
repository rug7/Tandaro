import React, { useState } from 'react';
import { Input } from './input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const PhoneInput = ({ value, onChange, placeholder, disabled, language = 'ar' }) => {
  const [selectedCountry, setSelectedCountry] = useState('+972');

  const countries = [
    { 
      code: '+972', 
       
      flag: '🇮🇱', 
     
    },
    { 
      code: '+970', 
      flag: '🇵🇸', 
      
    },
  ];

  const handlePhoneChange = (e) => {
    const phoneNumber = e.target.value.replace(/[^\d]/g, '');
    onChange(selectedCountry + phoneNumber);
  };

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    const currentNumber = value ? value.replace(/^\+\d{3}/, '') : '';
    onChange(countryCode + currentNumber);
  };

  const getPhoneNumberWithoutCountryCode = () => {
    if (!value) return '';
    return value.replace(/^\+\d{3}/, '');
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry) || countries[0];

  return (
    <div className="flex rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition-all">
      {/* Country Code Selector */}
      <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled}>
        <SelectTrigger className="w-32 border-0 border-r border-gray-200 rounded-l-2xl rounded-r-none focus:ring-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedCountryData.flag}</span>
            <span className="font-mono text-sm">{selectedCountry}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{country.flag}</span>
                <span className="font-mono text-sm font-medium">{country.code}</span>
                <span className="text-gray-600">{country.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Phone Number Input */}
      <Input
        type="tel"
        value={getPhoneNumberWithoutCountryCode()}
        onChange={handlePhoneChange}
        placeholder={placeholder || '50-123-4567'}
        disabled={disabled}
        className="border-0 rounded-l-none rounded-r-2xl focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-center text-lg py-6"
        dir="ltr"
      />
    </div>
  );
};

export default PhoneInput;