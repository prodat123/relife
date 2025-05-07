import React, { useState } from 'react';

const ScrapboxOpener = ({ scrapboxName, lootTable }) => {
    const [isOpening, setIsOpening] = useState(false);
    const [result, setResult] = useState(null);

    const openBox = () => {
        setIsOpening(true);
        setResult(null);

        // Create a weighted list
        const lootList = [];
        Object.entries(lootTable).forEach(([item, weight]) => {
        for (let i = 0; i < weight; i++) {
            lootList.push(item);
        }
        });

        // Fake suspense: simulate spinning
        const spinTime = 2000;
        setTimeout(() => {
        const randomItem = lootList[Math.floor(Math.random() * lootList.length)];
        setResult(randomItem);
        setIsOpening(false);
        }, spinTime);
    };

    return (
        <div className="p-4 rounded bg-gray-800 text-white shadow-md max-w-sm mx-auto">
        <h2 className="text-xl font-bold mb-2">{scrapboxName}</h2>
        <button
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
            onClick={openBox}
            disabled={isOpening}
        >
            {isOpening ? 'Opening...' : 'Open Box'}
        </button>

        {isOpening && (
            <p className="mt-4 animate-pulse text-yellow-400">
            Spinning the loot wheel...
            </p>
        )}

        {result && (
            <div className="mt-4 text-green-400 font-semibold">
            🎉 You got: <span className="underline">{result}</span>!
            </div>
        )}
        </div>
    );
};

export default ScrapboxOpener;
