function PlayerSprite({
  baseSprite = "/sprites/player.png",
  equipment,
  equipmentSlots,
}) {
  return (
    <div className="relative w-16 h-16">
      {/* Base sprite */}
      <img src={baseSprite} alt="Base Character" className="w-full pixel-art" />

      {/* Equipped item overlays */}
      {equipmentSlots.map(({ slot, top, left, zIndex }) => (
        <div
          key={slot}
          style={{
            width: "100%",
            position: "absolute",
            top,
            left,
            zIndex,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none", // no interactivity
          }}
        >
          {equipment?.[slot]?.image_url && (
            <img
              src={`${equipment[slot].image_url}?v=${new Date().getTime()}`}
              alt={`${equipment[slot].name || "None"} Gear`}
              className="pixel-art"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "fill",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default PlayerSprite;
