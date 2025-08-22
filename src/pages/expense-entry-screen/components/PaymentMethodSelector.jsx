import React from 'react';
import Icon from '../../../components/AppIcon';

// Payment methods to show
const paymentMethodOptions = [
  { id: 'cash', name: 'Cash', icon: 'Banknote', color: 'bg-green-600' },
  { id: 'credit_card', name: 'Credit Card', icon: 'CreditCard', color: 'bg-blue-600' },
  { id: 'debit_card', name: 'Debit Card', icon: 'CreditCard', color: 'bg-purple-600' },
  { id: 'apple_pay', name: 'Apple Pay', icon: 'apple_pay', color: 'bg-black' },
  { id: 'google_pay', name: 'Google Pay', icon: 'google_pay', color: 'bg-white border border-gray-300' },
];

// Official Apple Pay logo SVG
const ApplePayLogo = () => (
<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 30 30">
    <path d="M25.565,9.785c-0.123,0.077-3.051,1.702-3.051,5.305c0.138,4.109,3.695,5.55,3.756,5.55 c-0.061,0.077-0.537,1.963-1.947,3.94C23.204,26.283,21.962,28,20.076,28c-1.794,0-2.438-1.135-4.508-1.135 c-2.223,0-2.852,1.135-4.554,1.135c-1.886,0-3.22-1.809-4.4-3.496c-1.533-2.208-2.836-5.673-2.882-9 c-0.031-1.763,0.307-3.496,1.165-4.968c1.211-2.055,3.373-3.45,5.734-3.496c1.809-0.061,3.419,1.242,4.523,1.242 c1.058,0,3.036-1.242,5.274-1.242C21.394,7.041,23.97,7.332,25.565,9.785z M15.001,6.688c-0.322-1.61,0.567-3.22,1.395-4.247 c1.058-1.242,2.729-2.085,4.17-2.085c0.092,1.61-0.491,3.189-1.533,4.339C18.098,5.937,16.488,6.872,15.001,6.688z"></path>
</svg>
);

// Official Google Pay logo SVG
const GooglePayLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
<path fill="#e64a19" d="M42.858,11.975c-4.546-2.624-10.359-1.065-12.985,3.481L23.25,26.927	c-1.916,3.312,0.551,4.47,3.301,6.119l6.372,3.678c2.158,1.245,4.914,0.506,6.158-1.649l6.807-11.789	C48.176,19.325,46.819,14.262,42.858,11.975z"></path><path fill="#fbc02d" d="M35.365,16.723l-6.372-3.678c-3.517-1.953-5.509-2.082-6.954,0.214l-9.398,16.275	c-2.624,4.543-1.062,10.353,3.481,12.971c3.961,2.287,9.024,0.93,11.311-3.031l9.578-16.59	C38.261,20.727,37.523,17.968,35.365,16.723z"></path><path fill="#43a047" d="M36.591,8.356l-4.476-2.585c-4.95-2.857-11.28-1.163-14.137,3.787L9.457,24.317	c-1.259,2.177-0.511,4.964,1.666,6.22l5.012,2.894c2.475,1.43,5.639,0.582,7.069-1.894l9.735-16.86	c2.017-3.492,6.481-4.689,9.974-2.672L36.591,8.356z"></path><path fill="#1e88e5" d="M19.189,13.781l-4.838-2.787c-2.158-1.242-4.914-0.506-6.158,1.646l-5.804,10.03	c-2.857,4.936-1.163,11.252,3.787,14.101l3.683,2.121l4.467,2.573l1.939,1.115c-3.442-2.304-4.535-6.92-2.43-10.555l1.503-2.596	l5.504-9.51C22.083,17.774,21.344,15.023,19.189,13.781z"></path>
</svg>
);

// Replace AppleLogo with official Apple SVG
const AppleLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 50 50" fill="white">
    <path d="M 44.527344 34.75 C 43.449219 37.144531 42.929688 38.214844 41.542969 40.328125 C 39.601563 43.28125 36.863281 46.96875 33.480469 46.992188 C 30.46875 47.019531 29.691406 45.027344 25.601563 45.0625 C 21.515625 45.082031 20.664063 47.03125 17.648438 47 C 14.261719 46.96875 11.671875 43.648438 9.730469 40.699219 C 4.300781 32.429688 3.726563 22.734375 7.082031 17.578125 C 9.457031 13.921875 13.210938 11.773438 16.738281 11.773438 C 20.332031 11.773438 22.589844 13.746094 25.558594 13.746094 C 28.441406 13.746094 30.195313 11.769531 34.351563 11.769531 C 37.492188 11.769531 40.8125 13.480469 43.1875 16.433594 C 35.421875 20.691406 36.683594 31.78125 44.527344 34.75 Z M 31.195313 8.46875 C 32.707031 6.527344 33.855469 3.789063 33.4375 1 C 30.972656 1.167969 28.089844 2.742188 26.40625 4.78125 C 24.878906 6.640625 23.613281 9.398438 24.105469 12.066406 C 26.796875 12.152344 29.582031 10.546875 31.195313 8.46875 Z"></path>
  </svg>
);

const PaymentMethodSelector = ({
  selectedMethod = null,
  onMethodSelect = () => {},
  className = ''
}) => {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Payment Method</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {paymentMethodOptions.map((method) => (
          <button
            key={method.id}
            onClick={() => onMethodSelect(method)}
            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedMethod?.id === method.id
                ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50 hover:bg-card'
            }`}
          >
            <div className={`w-10 h-10 ${method.color} rounded-full flex items-center justify-center mb-2`}>
              {method.icon === 'apple_pay' ? <AppleLogo /> : method.icon === 'google_pay' ? <GooglePayLogo /> : <Icon name={method.icon} size={20} color="white" />}
            </div>
            <span className="text-xs text-center text-foreground font-medium leading-tight">
              {method.name}
            </span>
          </button>
        ))}
      </div>
      {/* Selected Method Summary */}
      {selectedMethod && (
        <div className="mt-4 p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${selectedMethod?.color} rounded-full flex items-center justify-center`}>
              {selectedMethod.icon === 'apple_pay' ? <AppleLogo /> : selectedMethod.icon === 'google_pay' ? <GooglePayLogo /> : <Icon name={selectedMethod.icon} size={16} color="white" />}
            </div>
            <div>
              <p className="text-foreground font-medium">{selectedMethod?.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;