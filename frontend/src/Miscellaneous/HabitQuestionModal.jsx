import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCodeBranch, faListCheck, faStarOfDavid } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import config from "../config";

const HabitQuestionModal = ({ onAnswer }) => {
    const userId = JSON.parse(localStorage.getItem("user"))?.id;
    const [visible, setVisible] = useState(true);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const [pathScores, setPathScores] = useState({
        Strength: 0,
        Bravery: 0,
        Intelligence: 0,
        Endurance: 0,
    });

    const [showResults, setShowResults] = useState(false);
    const [pathsData, setPathsData] = useState(null);
    const [focusStat, setFocusStat] = useState("");

    const questions = [
        { id: "lift_heavy", question: "Can you lift heavy objects easily?", paths: { Strength: 10 }},
        { id: "face_fears", question: "Have you faced a fear recently?", paths: { Bravery: 10 }},
        { id: "solve_problem", question: "Did you solve a difficult problem recently?", paths: { Intelligence: 10 }},
        { id: "physical_challenge", question: "Have you completed a tough physical challenge?", paths: { Endurance: 10 }},
        { id: "help_others", question: "Have you helped someone in a risky situation?", paths: { Bravery: 8, Strength: 5 }},
        { id: "study_hard", question: "Did you study or learn something new today?", paths: { Intelligence: 8 }},
        { id: "workout_today", question: "Did you complete a workout today?", paths: { Strength: 8, Endurance: 5 }},
        { id: "stay_persistent", question: "Did you persist through a difficult task today?", paths: { Endurance: 10 }},
        { id: "took_risk", question: "Did you take a brave risk today?", paths: { Bravery: 10 }},
        { id: "learned_new_skill", question: "Did you practice or learn a new skill today?", paths: { Intelligence: 8 }},
    ];

    useEffect(() => {
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5); // select 5 questions
        setSelectedQuestions(selected);
    }, []);

    const handleAnswer = (answer) => {
        if (!selectedQuestions[currentQuestionIndex]) return;

        if (answer === "Yes") {
        const updatedScores = { ...pathScores };
        for (const path in selectedQuestions[currentQuestionIndex].paths) {
            updatedScores[path] += selectedQuestions[currentQuestionIndex].paths[path];
        }
        setPathScores(updatedScores);
        console.log("Updated Path Scores:", updatedScores);
        }

        if (currentQuestionIndex < selectedQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        } else {
        finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setVisible(false);
        await fetchPathsData();
        setShowResults(true);
        onAnswer(pathScores); 
    };

    const handleSelectPath = async (pathId) => {
        try {
            await axios.post(`${config.backendUrl}/paths/select`, {
                userId,
                pathId
            });
            window.location.href = '/paths';
        } catch (err) {
          console.error('Error selecting path:', err);
        }
    };

    const fetchPathsData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/paths/free`); // Adjust your backend URL if needed
            const data = response.data;
            setPathsData(data);

            // Find stat with minimum score
            const lowestStat = Object.entries(pathScores).reduce((lowest, current) => 
                current[1] < lowest[1] ? current : lowest
            )[0];

            setFocusStat(lowestStat);
            console.log("Lowest Stat:", lowestStat);

        } catch (error) {
            console.error("Failed to fetch paths:", error);
        }
    };

    if (!visible && showResults && pathsData && focusStat) {
        const matchingPaths = pathsData.filter(path => path.statFocus.toLowerCase() === focusStat.toLowerCase());
        return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-gray-900 w-full max-w-md mx-4 rounded-lg shadow-lg p-6 text-white space-y-6">
            {/* <h2 className="text-2xl font-bold text-center">Your Path Results</h2>
            <ul className="space-y-2">
                {Object.entries(pathScores).map(([path, score]) => (
                <li key={path} className="flex justify-between">
                    <span>{path}</span>
                    <span>{score}</span>
                </li>
                ))}
            </ul> */}

            <div className="mt-6 p-4 bg-gray-700 rounded">
                <h1 className="text-lg font-bold text-center mb-2"><FontAwesomeIcon icon={faCodeBranch} /> Recommended Paths</h1>
                {matchingPaths.length === 0 ? (
                    <p className="text-gray-500">No more paths available to join.</p>
                ) : (
                    <div>
                    {matchingPaths.map((path) => (
                        <div key={path.id} className="rounded-lg p-4 shadow-md hover:shadow-lg transition duration-200 bg-gray-800">
                        <h3 className="text-xl font-semibold">{path.name}</h3>
                        <p className="text-sm text-gray-300">Focus: {path.statFocus}</p>
                        <p className="text-sm text-gray-300">Difficulty: {path.difficulty}</p>
                        <p className="text-sm text-gray-300">Gold Required: {path.goldRequirement}</p>
                        <p className="text-sm text-gray-300">Rank Required: {path.rankRequirement}</p>
                        <button
                            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            onClick={() => handleSelectPath(path.id)}
                        >
                            Start Path
                        </button>
                        </div>
                    ))}
                    </div>
                )}
            </div>

            <button
                onClick={() => setShowResults(false)}
                className="w-full bg-indigo-600 py-2 rounded hover:bg-indigo-500 mt-4"
            >
                Close
            </button>
            </div>
        </div>
        );
    }

    if (!visible || selectedQuestions.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
        <div className="bg-gray-800 w-full max-w-md mx-4 rounded-lg shadow-lg p-6 text-white space-y-6">
            <h2 className="text-xl font-semibold text-center">
            <FontAwesomeIcon className="mr-2 font-bold" icon={faListCheck} /> Quick Habit Check
            </h2>
            <p className="text-center">{selectedQuestions[currentQuestionIndex]?.question}</p>
            <div className="flex justify-center gap-4">
            <button
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
                onClick={() => handleAnswer("Yes")}
            >
                Yes
            </button>
            <button
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
                onClick={() => handleAnswer("No")}
            >
                No
            </button>
            </div>
            <p className="text-center text-gray-400 text-sm">
            Question {currentQuestionIndex + 1} of {selectedQuestions.length}
            </p>
        </div>
        </div>
    );
};

export default HabitQuestionModal;
