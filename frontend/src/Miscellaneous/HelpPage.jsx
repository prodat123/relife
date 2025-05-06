import React, { useState } from "react";
import { FaDiscord } from "react-icons/fa";

function HelpPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Example FAQs or Help Topics
    const helpTopics = [
        { id: 1, question: "Why should I do the quests?", answer: "Quests will provide the player with more XP, stats, and items. Doing these quests in real life will also help to improve your daily habits!" },
        { id: 2, question: "What do the stats mean?", answer: "Physical Strength directly relates to attack. Bravery is required to fight mini-bosses and bosses. Intelligence is used to get higher discounts in the shop. Stamina is a multiplier to health." },
        { id: 3, question: "What is gold for?", answer: "Gold is used to purchase items in the shop." },
        { id: 4, question: "What does increasing my level do?", answer: "It provides access to higher level quests which reward more stats, XP, and items." },
        { id: 5, question: "What do I get by entering the tower?", answer: "Currently each floor will reward a certain amount of gold. We also plan to make monsters drop materials for items as well." },
        { id: 6, question: "How do I equip gear?", answer: "Hover over your character in the account page and you will see circles; click on those circles and select the gear that you want to put on." },
        { id: 7, question: "What is Explosive Dice Roll (EDR)?", answer: "The EDR is the sum of rolling of 2 six-sided dice. It 'explodes' because if any dice lands on 6, another six-sided dice is rolled and added back to the sum.\n\n For example, if you roll 4 and 6, then you can roll again, and then get 3 for example. Your final EDR would be 4 + 6 + 3 = 13.\n If you rolled 6 and 6, then you would roll 2 more dice, one for each 6 you get. In this example, your extra rolls might come out to 6 and 5. Very lucky! Since you got another 6, you can reroll a third time, and say you get 2. Your final EDR would be 6 + 6 + 6 + 5 + 2 = 25.\n\n The following values are subject to being added by an exploding dice roll during a combat action: Damage, Armor, Melee Hit Ability, Melee Parry, Magic Penetration, Magic Resistance."},
        { id: 8, question: "What is Damage?", answer: "Damage dealt to health. Damage cannot go lower than 0. \n Damage = ([1 * strength] + [0.25 * bravery])^0.66 + items + EDR" },
        { id: 9, question: "What is Health?", answer: "Your hitpoints. If this reaches 0, you die.\n Health = ([10 * endurance] + [2 * strength])^0.7 + items" },
        { id: 10, question: "What is Armor?", answer: "Decreases incoming damage by this value.  Armor cannot go lower than 0.\n Armor =  (0.25 * endurance)0.7 + items + EDR" },
        { id: 11, question: "What is Melee Hit Ability?", answer: "In order for a hit to succeed, this value must be higher than the opposing parry value.\n Melee hit ability = 9 + ([1.25 * strength] + [0.5 * bravery])^0.5 + items + EDR" },
        { id: 12, question: "What is Melee Parry?", answer: "In order to block a hit, this value must be equal or greater than the opposing hit ability value.\n Melee parry = 8 + ([0.75 * endurance] + [0.25 * strength])0.5 + items + EDR" },
        { id: 13, question: "What is Max Mana?", answer: "The maximum mana you can have during combat. Mana regen won’t allow your current mana to go higher than this.\n Max Mana = [10 * intelligence] + [2 * endurance] + items" },
        { id: 14, question: "What is Mana Regeneration?", answer: "Passive regeneration amount for your mana every combat round.\n Mana Regeneration = [2 * intelligence] + items" },
        { id: 15, question: "What is Magic Penetration?", answer: "In order for an offensive spell to succeed, this value must be higher than the opposing magic resistance value.\n Magic Penetration = 9 + ([1 * intelligence] + [0.25 * strength])^0.5 + items + EDR" },
        { id: 16, question: "What is Magic Resistance?", answer: "In order to block an incoming offensive spell, this value must be equal or greater than the opposing magic penetration value.\n Magic resistance = 9 + ([0.8 * intelligence] + [0.25*endurance])^0.5 + items + EDR" },
        { id: 17, question: "What is the Spell Effect Multiplier", answer: "Multiplies all spell effects by this amount without changing their mana cost, duration or cooldown. Ex: If a spell would heal you for 5, then with a 2x multiplier you would instead heal 10. \nSpell effect multiplier = ([0.5 * intelligence] + [0.15 * strength])^0.33" },    
    ];

    const joinDiscord = async () => {
        window.open("https://discord.gg/5Pzp4nMxkF", "_blank", "noopener,noreferrer");
    };

    // Filter topics based on search query
    const filteredTopics = helpTopics.filter((topic) =>
        topic.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    

    return (
        <div className="grid lg:grid-cols-5 md:grid-cols-4 container mx-auto p-6">
            <div className="col-start-2 col-span-4 flex items-center justify-center flex-col">
                <h1 className="text-3xl font-bold mb-4 text-center text-white">Need Help?</h1>
                <p className="text-center mb-6 text-white">Search for answers or browse through common topics.</p>

                {/* Search Bar */}
                <div className="search-bar flex justify-center mb-6">
                    <input
                    type="text"
                    placeholder="Search for help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2  rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                </div>

                {/* Help Topics */}
                <div className="help-topics">
                    {filteredTopics.length > 0 ? (
                    filteredTopics.map((topic) => (
                        <div key={topic.id} className="mb-4 p-4 rounded shadow-sm bg-gray-800">
                        <h2 className="font-semibold text-white text-lg">{topic.question}</h2>
                        <p className="text-white mt-2">
                            {topic.answer.split("\n").map((line, index) => (
                                <React.Fragment key={index}>
                                    {line}
                                    <br />
                                </React.Fragment>
                            ))}
                        </p>

                        </div>
                    ))
                    ) : (
                    <p className="text-center text-white">No results found. Try searching for something else.</p>
                    )}
                </div>
                <button
                    onClick={joinDiscord}
                    className="flex items-center justify-center gap-2 px-4 py-2 my-2 bg-[#5865F2] text-white font-medium text-lg rounded-md shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
                >
                    <FaDiscord size={24} />
                    Join Our Community
                </button>
            </div>
            
        </div>
    );
}

export default HelpPage;
