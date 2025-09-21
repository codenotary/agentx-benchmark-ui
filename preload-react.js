// Preload React to make it available globally before any modules load
(function() {
  // Define a minimal React-like object structure for early loading
  if (typeof window !== 'undefined' && !window.React) {
    // Create a temporary React object to prevent undefined errors
    window.React = {
      forwardRef: function(render) {
        // Return a component that passes props and ref properly
        return function ForwardedComponent(props) {
          const { ref, ...otherProps } = props || {};
          return render(otherProps, ref);
        };
      },
      createElement: function(type, props, ...children) {
        return { type, props: props || {}, children };
      },
      createContext: function(defaultValue) {
        const context = {
          Provider: function Provider(props) { 
            return props.children; 
          }, 
          Consumer: function Consumer() {
            return null;
          },
          _currentValue: defaultValue,
          _defaultValue: defaultValue
        };
        return context;
      },
      Component: function Component() {},
      PureComponent: function PureComponent() {},
      Fragment: 'React.Fragment',
      StrictMode: function StrictMode(props) { return props.children; },
      version: '18.3.1',
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {}
    };
    
    // Also expose commonly used functions directly
    window.forwardRef = window.React.forwardRef;
    window.createElement = window.React.createElement;
    window.createContext = window.React.createContext;
    
    // Mark this as a temporary implementation
    window.React.__temporary = true;
    
    console.log('[Preload] Temporary React object created with forwardRef support');
  }
})();