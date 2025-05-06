import { faDiamond } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";

function UpdatesPage() {
    const [groupedUpdates, setGroupedUpdates] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const SHEET_CSV_URL =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwRovdOlYXUfnyGbl3gajTGp8Z2CdymvwK2SxB7uys6IXi4RhNJ6BF7WyaSClvcCMJKN4elSgVh7o7/pub?gid=0&single=true&output=csv";

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const response = await fetch(SHEET_CSV_URL);
                if (!response.ok) {
                    throw new Error("Failed to fetch updates.");
                }
                const text = await response.text();
                const rows = text.split("\n").map((row) => row.split(","));
                localStorage.setItem("updatesData", JSON.stringify(text));

    
                if (rows.length > 1) {
                    const updates = rows.slice(1).map(([date, update]) => ({
                        date: date.trim(),
                        update: update ? update.trim() : "No update provided.",
                    }));
    
                    // Group updates by date
                    const grouped = updates.reduce((acc, { date, update }) => {
                        if (!acc[date]) {
                            acc[date] = [];
                        }
                        acc[date].push(update);
                        return acc;
                    }, {});
    
                    setGroupedUpdates(grouped);
    
                    // Save the latest update date in localStorage
                } else {
                    setGroupedUpdates({});
                }
            } catch (err) {
                console.error("Error fetching updates:", err);
                setError("Failed to load updates.");
            } finally {
                setLoading(false);
            }
        };
    
        fetchUpdates();
        

    }, []); // Trigger on updates availability or function change

    return (
        <div className="grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-4 p-6">
            <div className="col-start-2 col-span-4">
                <h2 className="text-2xl text-white font-bold mb-4 text-center">Latest Updates</h2>
                {loading && <p className="text-center text-gray-500">Loading updates...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                {!loading && !error && Object.keys(groupedUpdates).length === 0 && (
                    <p className="text-center text-gray-500">No updates available at this time.</p>
                )}
                {!loading && !error && Object.keys(groupedUpdates).length > 0 && (
                    <ul className="space-y-4">
                        {Object.entries(groupedUpdates).map(([date, updates], index) => (
                            <li key={index} className="p-4 rounded-md shadow bg-gray-700 text-white">
                                <p className="font-semibold">{date}</p>
                                <ul className="mt-2 space-y-2">
                                    {updates.map((update, idx) => (
                                        <li key={idx} className="text-white">
                                            <FontAwesomeIcon icon={faDiamond} /> {update}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default UpdatesPage;
