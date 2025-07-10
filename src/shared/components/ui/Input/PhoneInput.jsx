import React from 'react';
import PhoneNumberInput from 'react-phone-number-input';

const PhoneInput = ({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Ingresa el número',
  required = false,
  disabled = false,
  isValid = null, // null, true, false
  ...props 
}) => {
  // Mantener el estilo visual actual del proyecto
  const getInputClasses = () => {
    let classes = className;
    
    if (isValid === true) {
      classes += ' valid';
    } else if (isValid === false) {
      classes += ' invalid';
    }
    
    return classes;
  };

    return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .phone-input-no-flags .PhoneInputCountryIcon {
          display: none !important;
        }
        .phone-input-no-flags .PhoneInputCountryIconImg {
          display: none !important;
        }
        .phone-input-no-flags img {
          display: none !important;
        }
        .phone-input-no-flags .PhoneInputCountrySelect {
          min-width: 80px !important;
          max-width: 80px !important;
          width: 80px !important;
        }
      `}</style>
      <PhoneNumberInput
        international
        countryCallingCodeEditable={false}
        defaultCountry="AR"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        numberInputProps={{
          required,
          className: getInputClasses(),
          style: {
            // Usar estilos inline para asegurar que se mantenga el diseño
            flex: '1',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            border: '2px solid #d1d5db',
            borderRadius: '0 0.5rem 0.5rem 0',
            backgroundColor: 'white',
            color: '#1f2937',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            fontFamily: 'inherit',
            outline: 'none',
            borderLeft: 'none',
            ...(disabled && {
              backgroundColor: '#f9fafb',
              color: '#9ca3af',
              cursor: 'not-allowed',
              borderColor: '#e5e7eb'
            })
          }
        }}
        countrySelectProps={{
          style: {
            padding: '0.75rem 0.25rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            border: '2px solid #d1d5db',
            borderRadius: '0.5rem 0 0 0.5rem',
            backgroundColor: 'white',
            color: '#1f2937',
            minWidth: '80px',
            maxWidth: '80px',
            width: '80px',
            outline: 'none',
            borderRight: 'none',
            textAlign: 'center'
          }
        }}
        style={{
          display: 'flex',
          gap: '0',
          width: '100%',
          '--PhoneInput-color--focus': '#059669'
        }}
        // Ocultar banderas completamente
        flags={false}
        // Usar solo abreviaciones de país
        labels={{
          'AR': 'ARG',
          'UY': 'URU', 
          'BR': 'BRA',
          'US': 'USA',
          'ES': 'ESP',
          'MX': 'MEX'
        }}
        // CSS adicional para ocultar banderas si persisten
        className="phone-input-no-flags"
        {...props}
      />
    </div>
  );
};

export default PhoneInput; 