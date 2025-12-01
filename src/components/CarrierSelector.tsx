import { useState, useEffect } from 'react';

interface CarrierSelectorProps {
  value: string;
  onChange: (carrier: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const STANDARD_CARRIERS = ['Verizon', 'AT&T', 'T-Mobile', 'Other (Custom)'];

export default function CarrierSelector({
  value,
  onChange,
  label = 'Carrier',
  required = false,
  className = '',
}: CarrierSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customCarrier, setCustomCarrier] = useState<string>('');

  useEffect(() => {
    if (STANDARD_CARRIERS.slice(0, 3).includes(value)) {
      setSelectedOption(value);
      setCustomCarrier('');
    } else if (value && value !== '') {
      setSelectedOption('Other (Custom)');
      setCustomCarrier(value);
    } else {
      setSelectedOption('');
      setCustomCarrier('');
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedOption(newValue);

    if (newValue === 'Other (Custom)') {
      setCustomCarrier('');
      onChange('');
    } else {
      setCustomCarrier('');
      onChange(newValue);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomCarrier(newValue);
    onChange(newValue);
  };

  const showCustomInput = selectedOption === 'Other (Custom)';

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        value={selectedOption}
        onChange={handleSelectChange}
        required={required && !showCustomInput}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#27AAE1] focus:border-transparent"
      >
        <option value="">Select a carrier...</option>
        {STANDARD_CARRIERS.map((carrier) => (
          <option key={carrier} value={carrier}>
            {carrier}
          </option>
        ))}
      </select>

      {showCustomInput && (
        <input
          type="text"
          value={customCarrier}
          onChange={handleCustomChange}
          placeholder="Enter custom carrier name"
          required={required}
          className="w-full px-3 py-2 mt-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#27AAE1] focus:border-transparent"
        />
      )}
    </div>
  );
}
