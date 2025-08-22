import React, { useState, useEffect, useRef } from 'react';
import Input from '../../../components/ui/Input';

const AmountInput = ({ 
  value = '', 
  onChange = () => {}, 
  error = '',
  className = '' 
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isFocused) {
      // On blur, format to two decimals
      if (value) {
        const numericValue = parseFloat(value?.toString()?.replace(/[^0-9.]/g, ''));
        if (!isNaN(numericValue)) {
          setDisplayValue(numericValue?.toFixed(2));
        } else {
          setDisplayValue('');
        }
      } else {
        setDisplayValue('');
      }
    } else {
      // While focused, show raw value
      setDisplayValue(value?.toString() || '');
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const inputValue = e?.target?.value;
    // Allow only numbers and one decimal point
    const numericValue = inputValue?.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const decimalCount = (numericValue?.match(/\./g) || [])?.length;
    if (decimalCount > 1) return;
    // Limit to 2 decimal places
    const parts = numericValue?.split('.');
    if (parts?.[1] && parts?.[1]?.length > 2) return;
    setDisplayValue(numericValue);
    onChange(numericValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format to two decimals on blur
    if (displayValue) {
      const num = parseFloat(displayValue);
      if (!isNaN(num)) {
        setDisplayValue(num.toFixed(2));
        onChange(num.toFixed(2));
      }
    }
  };

  return (
    <div className={`${className}`}>
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-semibold text-muted-foreground z-10">
          $
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder="0.00"
          error={error}
          className="text-center text-3xl font-bold h-16 pl-12 pr-4"
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            textAlign: 'center'
          }}
        />
      </div>
      {displayValue && !error && (
        <p className="text-center text-sm text-muted-foreground mt-2">
          ${Number(displayValue).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </p>
      )}
    </div>
  );
};

export default AmountInput;