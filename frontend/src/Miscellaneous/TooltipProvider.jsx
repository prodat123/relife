import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useFloating, shift, offset, flip } from "@floating-ui/react";
import { createPortal } from "react-dom";
import Tooltip from "./Tooltip";

const TooltipContext = createContext();
export const useTooltip = () => useContext(TooltipContext);

export const TooltipProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const mouseCoords = useRef({ x: 0, y: 0 });

  // 1. Get the `floatingStyles` object, which contains everything
  const { refs, floatingStyles, update } = useFloating({
    open: isOpen,
    strategy: "fixed",
    placement: "top",
    middleware: [
      offset(15),
      flip({ fallbackPlacements: ["right", "bottom", "left"] }), // If 'top' fails, try these other positions
      shift({ padding: 10 }),
    ],
  });

  useEffect(() => {
    const handleMouseMove = (event) => {
      mouseCoords.current = { x: event.clientX, y: event.clientY };
      update();
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [update]);

  const showTooltip = (newContent) => {
    const virtualElement = {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: mouseCoords.current.x,
        y: mouseCoords.current.y,
        top: mouseCoords.current.y,
        left: mouseCoords.current.x,
        right: mouseCoords.current.x,
        bottom: mouseCoords.current.y,
      }),
    };

    setContent(newContent);
    refs.setReference(virtualElement);
    setIsOpen(true);
  };

  const hideTooltip = () => {
    setIsOpen(false);
  };

  const value = { showTooltip, hideTooltip };

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {createPortal(
        // 2. Pass the complete `floatingStyles` object to the `style` prop
        <Tooltip
          isOpen={isOpen}
          content={content}
          ref={refs.setFloating}
          style={floatingStyles}
          // Add these two props to pass the coordinates down
          cursorX={mouseCoords.current.x}
          cursorY={mouseCoords.current.y}
        />,
        document.body
      )}
    </TooltipContext.Provider>
  );
};
