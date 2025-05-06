import React, { useEffect, useState } from "react";

const ItemPopup = ({ icon, name, quantity, message, success, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 500); // Delay removal for smooth animation
        }, 3000); // 3 seconds display time

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed z-[99999] bottom-5 right-5 p-4 rounded-lg shadow-lg transform transition-all duration-500 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-90"} 
            ${success ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            <div className="flex items-center space-x-3">
                {icon && <img src={icon} alt={name} className="w-12 h-12" />}
                <div>
                    {name && <p className="font-bold">{name}</p>}
                    {message && <p className="text-sm">{message}</p>}
                    {quantity && (<p className="text-sm">+{quantity} crafted</p>)}
                </div>
            </div>
        </div>
    );
};

export default ItemPopup;
