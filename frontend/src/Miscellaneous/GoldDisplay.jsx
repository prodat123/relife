import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Account/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins } from "@fortawesome/free-solid-svg-icons";

const GoldDisplay = () => {
  const { accountDataRef } = useContext(UserContext);
  const [gold, setGold] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        accountDataRef.current &&
        accountDataRef.current.currency !== undefined
      ) {
        setGold(accountDataRef.current.currency);
      }
    }, 100); // You can reduce or increase this as needed

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="ml-2 block md:text-sm font-semibold text-yellow-400">
      <FontAwesomeIcon icon={faCoins} /> {gold}
    </p>
  );
};

export default GoldDisplay;
