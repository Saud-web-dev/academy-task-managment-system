import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../service/api';
import {
  LayoutGrid, Layers, CircleDashed, Square, Boxes
} from 'lucide-react';

// ============================================
// 5 PROFESSIONAL UI DESIGN SYSTEMS
// (structure only — radius, shadow, spacing, sidebar, buttons.
//  Colors stay owned by ThemeContext, these never touch --bg-*/--text-* vars)
// ============================================
const UI_STYLES_CONFIG = [
  {
    id: 'material',
    name: 'Material Elevated',
    icon: Layers,
    description: 'Google Material 3 — layered elevation, pill buttons',
  },
  {
    id: 'glass',
    name: 'Glass Studio',
    icon: Boxes,
    description: 'Frosted glass panels, soft blur, floating sidebar',
  },
  {
    id: 'neumorph',
    name: 'Soft Neumorph',
    icon: CircleDashed,
    description: 'Embossed soft-UI, dual shadows, low contrast',
  },
  {
    id: 'flat',
    name: 'Flat Minimal',
    icon: Square,
    description: 'No shadows, thin borders, dense whitespace',
  },
  {
    id: 'corporate',
    name: 'Corporate Sharp',
    icon: LayoutGrid,
    description: 'Sharp corners, strong borders, SaaS dashboard density',
  },
];

const UIStyleContext = createContext(null);

export const useUIStyle = () => {
  const context = useContext(UIStyleContext);
  if (!context) {
    return {
      currentUIStyle: 'material',
      availableUIStyles: UI_STYLES_CONFIG,
      updateUIStyle: async () => ({ success: false }),
      loading: false,
      applyUIStyle: (styleId) => {
        if (styleId) {
          document.documentElement.setAttribute('data-ui-style', styleId);
          localStorage.setItem('user-ui-style', styleId);
        }
      },
    };
  }
  return context;
};

export const UIStyleProvider = ({ children }) => {
  const [currentUIStyle, setCurrentUIStyle] = useState('material');
  const [loading, setLoading] = useState(true);
  const [uiStyleChanged, setUIStyleChanged] = useState(false);

  // NOTE: uses the same generic /settings/:key endpoints your
  // Setting controller already exposes (getSetting / updateSetting) —
  // no new backend routes needed, key is just "uiStyle".
  const applyUIStyle = (styleId) => {
    if (!styleId) return;
    document.documentElement.setAttribute('data-ui-style', styleId);
    localStorage.setItem('user-ui-style', styleId);
  };
const fetchUIStyle = async () => {
  try {

    setLoading(true);

    const res = await api.get("/settings/uiStyle");

    const style = res.data.value || "material";

    setCurrentUIStyle(style);

    applyUIStyle(style);

  } catch (err) {

    console.log(err);

  } finally {

    setLoading(false);

  }
};

  const updateUIStyle = async (styleId) => {



    try {

      const exists = UI_STYLES_CONFIG.some(
        item => item.id === styleId
      );

      if (!exists) {
        throw new Error("Invalid Style");
      }


      const response = await api.put("/settings/uiStyle", {
        value: styleId,
      });


      if (response.status === 200 && response.data.success) {

        setCurrentUIStyle(styleId);

        applyUIStyle(styleId);

        localStorage.setItem("user-ui-style", styleId);

        return {
          success: true,
        };
      }

      return {
        success: false,
        error: response.data.message,
      };

    } catch (error) {

      console.log(error);

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message,
      };

    }
  };

  useEffect(() => {
    fetchUIStyle();
  }, []);

  const value = {
    currentUIStyle,
    updateUIStyle,
    applyUIStyle,
    loading,
    uiStyleChanged,
    setUIStyleChanged,
    availableUIStyles: UI_STYLES_CONFIG,
  };

  return (
    <UIStyleContext.Provider value={value}>
      {children}
    </UIStyleContext.Provider>
  );
};

export default UIStyleContext;