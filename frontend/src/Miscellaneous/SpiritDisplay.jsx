import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Account/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFireAlt } from "@fortawesome/free-solid-svg-icons";

const SpiritDisplay = () => {
    const { accountDataRef } = useContext(UserContext);
    const [spiritHealth, setSpiritHealth] = useState(0);
    const [maxSpiritHealth, setMaxSpiritHealth] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (accountDataRef.current && accountDataRef.current.spiritHealth !== undefined) {
                setSpiritHealth(accountDataRef.current.spiritHealth);
                setMaxSpiritHealth(accountDataRef.current.maxSpiritHealth);
            }
        }, 100); // You can reduce or increase this as needed

        return () => clearInterval(interval);
    }, []);

    return (
        <div className='ml-auto text-cyan-300'>
            <FontAwesomeIcon icon={faFireAlt} />
            <label className='font-semibold ml-1 text-md'>{spiritHealth}<span className="text-[10px]">/{maxSpiritHealth}</span></label>
        </div>
    );
};

export default SpiritDisplay;
