import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios"; // Import axios

// (This would typically come from an AuthContext)
// For this example, let's assume we have the user's ID and initial font.
const MOCK_USER = {
  id: 123,
  initialFont: "solo", // The font preference loaded from the database
};

// 1. Define the options that will be available in the UI
const FONT_OPTIONS = {
  sans: { name: "Modern (Lato)", className: "font-sans" },
  solo: { name: "Classic (Cinzel)", className: "font-solo" },
  display: { name: "Elegant (Playfair)", className: "font-display" },
  mono: { name: "Technical (Mono)", className: "font-mono" },
  script: { name: "Macondo", className: "font-script" },
  serifKr: { name: "Noto", className: "font-serifKr" },
  heading: { name: "Oswald", className: "font-heading" },
};

// 2. Create the context
const FontContext = createContext();

// 3. Create the Provider component
export const FontProvider = ({ children, user }) => {
  // Initialize state with the user's saved font, falling back to localStorage or a default
  const [font, setFont] = useState(
    user?.initialFont || localStorage.getItem("app-font") || "sans"
  );

  // --- This function now uses axios to call your backend ---
  const saveFontPreference = async (userId, selectedFont) => {
    // Don't try to save if there's no logged-in user
    if (!userId) return;

    try {
      // Use axios.post and include the withCredentials option for session handling
      await axios.post(
        "/user/font/save",
        { userId, font: selectedFont },
        { withCredentials: true }
      );

      console.log("Font preference saved successfully:", selectedFont);
    } catch (error) {
      console.error("Error saving font:", error);
    }
  };

  const applyFont = useCallback((selectedFont) => {
    const newClassName = FONT_OPTIONS[selectedFont]?.className;
    if (!newClassName) return;

    const allFontClasses = Object.values(FONT_OPTIONS).map((f) => f.className);
    const selector = allFontClasses.map((cls) => `.${cls}`).join(", ");
    const elementsToUpdate = document.querySelectorAll(selector);

    elementsToUpdate.forEach((element) => {
      element.classList.remove(...allFontClasses);
      element.classList.add(newClassName);
    });
  }, []);

  useEffect(() => {
    // 1. Apply the font change to the UI
    applyFont(font);

    // 2. Save the choice to localStorage for instant reloads
    localStorage.setItem("app-font", font);

    // 3. Save the choice to the database for persistence
    saveFontPreference(user?.id, font);

    // ... (your MutationObserver logic is unchanged)
    const observer = new MutationObserver(() => applyFont(font));
    observer.observe(document.getElementById("root"), {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [font, applyFont, user]); // Add `user` as a dependency

  const value = { font, setFont, fontOptions: FONT_OPTIONS };

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
};

// 5. Create a custom hook for easy access to the context
export const useFont = () => useContext(FontContext);
