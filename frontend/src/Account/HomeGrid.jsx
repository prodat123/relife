import React, { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DraggableItem } from "./DraggableItem";
import { DroppableCell } from "./DroppableCell";
import config from "../config";
import axios from "axios";

const INITIAL_GRID_SIZE = 49;
const createInitialGrid = () =>
  Array.from({ length: INITIAL_GRID_SIZE }, (_, i) => ({
    id: `cell-${i}`,
    item: null,
  }));

// --- MAIN COMPONENT ---
export function HomeGrid({ userData, userInventory }) {
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const [grid, setGrid] = useState(createInitialGrid());
  const [isEditing, setIsEditing] = useState(false); // New state for edit mode
  const [isSaving, setIsSaving] = useState(false); // State for loading feedback
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState(null);

  // Get a list of IDs for items currently placed on the grid
  const placedItemIds = useMemo(
    () => new Set(grid.map((cell) => cell.item?.id).filter(Boolean)),
    [grid],
  );

  // Filter the main inventory to get only the items that haven't been placed
  const availableInventory = userInventory.filter(
    (item) => !placedItemIds.has(item.id) && item.type === "furniture",
  );

  // --- 1. LOAD LAYOUT ON MOUNT ---
  useEffect(() => {
    if (userData?.roomLayout) {
      try {
        const savedLayout = JSON.parse(userData.roomLayout);

        const rehydratedGrid = savedLayout.map((cell) => {
          const fullItem = cell.itemId
            ? userInventory.find((invItem) => invItem.id === cell.itemId)
            : null;
          return {
            id: cell.id,
            item: fullItem || null,
          };
        });

        setGrid(rehydratedGrid);
      } catch (error) {
        console.error("Failed to parse saved room layout:", error);
        // If parsing fails, start with a blank grid
        setGrid(createInitialGrid());
      }
    }
  }, [userData, userInventory]); // This effect runs when the user data is loaded

  const filteredInventory = useMemo(() => {
    if (!searchQuery) {
      return availableInventory; // Show all items if search is empty
    }
    return availableInventory.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [availableInventory, searchQuery]);

  // --- 2. SAVE LAYOUT TO BACKEND ---
  const saveLayout = async () => {
    setIsSaving(true);
    try {
      const result = await axios.post(
        `${config.backendUrl}/user/layout/save`,
        {
          userId: userId,
          grid: grid, // Send the current grid state to the backend
        },
        {
          withCredentials: true,
        },
      );
      // On success, exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save layout:", error);
      alert("Error: Could not save layout."); // Or use a more elegant notification
    } finally {
      setIsSaving(false);
    }
  };

  // --- (The rest of the logic remains similar) ---

  function handleDragStart(event) {
    const { active } = event;
    setActiveItem(active.data.current.item);
  }

  function handleDragEnd(event) {
    const { over, active } = event;

    // When an item is dropped outside a valid cell, remove it from the grid
    if (!over) {
      setGrid((prevGrid) => {
        return prevGrid.map((cell) =>
          cell.item?.id === active.data.current.item.id
            ? { ...cell, item: null }
            : cell,
        );
      });
      return;
    }

    // The rest of the drag-and-drop logic
    const draggedItem = active.data.current.item;

    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      const targetCellIndex = newGrid.findIndex((cell) => cell.id === over.id);
      if (targetCellIndex === -1) return prevGrid;

      const originalCellIndex = newGrid.findIndex(
        (cell) => cell.item?.id === draggedItem.id,
      );
      if (originalCellIndex !== -1) {
        newGrid[originalCellIndex].item = null;
      }

      newGrid[targetCellIndex].item = draggedItem;

      return newGrid;
    });
  }

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // drag starts after moving 5px
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150, // hold for 150ms before drag
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full relative bg-gradient-to-br from-gray-900 to-slate-800 p-6 rounded-lg shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-solo text-white font-bold">My Room</h2>
          {/* --- EDIT / SAVE BUTTON --- */}
          {userData.id === userId && (
            <button
              onClick={isEditing ? saveLayout : () => setIsEditing(true)}
              disabled={isSaving}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 border-2 w-32
                            ${
                              isSaving
                                ? "bg-gray-500 border-gray-400 cursor-not-allowed"
                                : isEditing
                                  ? "bg-green-600 border-green-400 text-white"
                                  : "bg-blue-600 border-blue-400 text-white"
                            }`}
            >
              {isSaving ? "Saving..." : isEditing ? "Save Layout" : "Edit"}
            </button>
          )}
        </div>

        {/* The Grid */}
        <div className="relative mb-8">
          <img
            src={"/sprites/room-background.png"}
            className="w-full h-full pixel-art absolute"
          />
          <div className="relative grid grid-cols-7 z-50">
            {grid.map(({ id, item }) => (
              <DroppableCell
                isEditing={isEditing}
                key={id}
                id={id}
                item={item}
              />
            ))}
          </div>
        </div>

        {/* --- CONDITIONAL INVENTORY --- */}
        {isEditing && (
          <div className="border-t-2 border-slate-700 pt-6">
            <h3 className="text-xl font-solo text-slate-300 mb-4 text-center">
              Place Furniture
            </h3>

            {/* --- Search Bar --- */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for furniture..."
                className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* --- Item Grid --- */}
            <div className="grid grid-cols-4 gap-4 min-h-[112px] max-h-[300px] overflow-y-auto">
              {/* Map over the filtered list */}
              {filteredInventory.map((item) => (
                <DraggableItem key={item.id} id={item.id} item={item} />
              ))}

              {/* --- Updated "No Items" Messages --- */}
              {/* This shows if the entire inventory is empty */}
              {availableInventory.length === 0 && (
                <p className="text-slate-500 col-span-4 text-center">
                  All items have been placed.
                </p>
              )}

              {/* This shows if the search returns no results */}
              {availableInventory.length > 0 &&
                filteredInventory.length === 0 && (
                  <p className="text-slate-500 col-span-4 text-center">
                    No items found matching "{searchQuery}".
                  </p>
                )}
            </div>
          </div>
        )}
      </div>
      <DragOverlay>
        {activeItem ? (
          <DraggableItem item={activeItem} isOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
