import React, { createContext, useRef, useCallback } from "react";
import axios from "axios";
import config from "../config";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const accountDataRef = useRef(null);

    const fetchAccountData = useCallback(async (userId) => {
        try {
            const response = await axios.get(`${config.backendUrl}/account`, {
                params: { userId },
            });
            accountDataRef.current = response.data;
            console.log(accountDataRef.current);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }, []);

    return (
        <UserContext.Provider value={{ accountDataRef, fetchAccountData }}>
            {children}
        </UserContext.Provider>
    );
};
