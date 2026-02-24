import React from "react";
import { useDraggable } from "@dnd-kit/core";

export function DraggableItem({ id, item }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
      data: { item }, // Pass the full item data
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-full h-full rounded-md flex flex-col items-center text-center cursor-grab
                  ${isDragging ? "opacity-50 shadow-2xl" : "opacity-100"}`}
    >
      <img
        src={item.image_url}
        alt={item.name}
        className="w-full h-full pixel-art object-contain pointer-events-none"
      />
    </div>
  );
}
