import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { DraggableItem } from "./DraggableItem"; // We can reuse this to show placed items

export function DroppableCell({ isEditing, id, item }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${
        item ? "md:w-full md:h-full" : "md:w-20 md:h-20 w-16 h-16"
      } rounded-md 
        
                  ${
                    isEditing
                      ? `border-dashed  ${
                          isOver
                            ? "border-green-500 border-2 bg-green-500/10"
                            : "border-slate-700 bg-slate-800/50"
                        }`
                      : "border-0"
                  }
                  transition-colors duration-200
                 
                  flex items-center justify-center`}
    >
      {/* If an item is placed in this cell, render it as a draggable item too! */}
      {item ? (
        <DraggableItem id={item.id} item={item} />
      ) : (
        <>{isEditing && <span className="text-slate-600 text-3xl">+</span>}</>
      )}
    </div>
  );
}
