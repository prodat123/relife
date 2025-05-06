import axios from "axios";
import React, { useEffect, useState } from "react";
import config from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faBook, faChartBar, faCodeBranch, faScroll, faTag, faTags, faThumbTack, faThumbTackSlash, faX } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const CurrentStepPopup = ({updated}) => {
    const [isVisible, setIsVisible] = useState(JSON.parse(localStorage.getItem('stepVisible') || 'true'));
    const userId = JSON.parse(localStorage.getItem("user"))?.id;
    const [activePaths, setActivePaths] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPaths();
    }, [userId, updated]);

    const fetchPaths = async () => {
        try {
        const [activeRes] = await Promise.all([
            axios.get(`${config.backendUrl}/paths/active?userId=${userId}`),
        ]);
    
        setActivePaths(activeRes.data);
        setLoading(false);
        } catch (err) {
        console.error('Error fetching paths:', err);
        setLoading(false);
        }
    };

    const currentStepInfo = activePaths?.map((path) => {
        const steps = JSON.parse(path.steps);
        const currentStep = steps[path.progress];
        return {
        pathName: path.name,
        step: currentStep,
        progress: path.progress,
        totalSteps: steps.length,
        };
    });

    const togglePopup = () => {
        if(isVisible){
            localStorage.setItem('stepVisible', false);
        }else{
            localStorage.setItem('stepVisible', true);
        }
        setIsVisible(!isVisible);
    };

    if (activePaths.length === 0) return null;

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={togglePopup}
                className={`fixed top-1/2 right-0 transform -translate-y-1/2 z-50 ${!isVisible ? 'bg-yellow-400 hover:bg-yellow-400' : 'bg-red-500'} rounded-l-md text-black font-semibold w-8 py-2 shadow-sm backdrop-blur-md`}
            >
                <span className="flex flex-col items-center justify-center leading-tight text-xs">
                    {isVisible ? (
                        <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faAngleRight} />

                        C<br />l<br />o<br />s<br />e
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faAngleLeft} />

                        P<br />a<br />t<br />h
                        </div>
                    )}
                </span>

            </button>




            {/* Popup */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-72 right-10 z-50 bg-gray-900 shadow-lg border border-yellow-400 text-white rounded-md w-[250px] max-w-[90vw] p-4"
                    >
                    {currentStepInfo.map((info, idx) => (
                        <div key={idx} className="mb-4">
                        <p className="text-sm text-gray-300">
                            <span className="font-semibold text-white">{info.pathName}</span> – Step{" "}
                            {info.progress + 1} / {info.totalSteps}
                        </p>
                        <p className="text-md font-semibold text-yellow-300 mt-1">{info.step.head}</p>
                        <p className="text-sm text-gray-200">{info.step.description}</p>

                        <div className="text-xs mt-2 space-y-1">
                            <p><FontAwesomeIcon icon={faThumbTack} /> Required Quests: {info.step.requirement?.numOfQuests}</p>
                            {info.step.requirement?.questTags?.length > 0 && (
                            <p><FontAwesomeIcon icon={faTags} /> Tags: {info.step.requirement.questTags.join(", ")}</p>
                            )}
                            {info.step.requirement?.questNames?.length > 0 && (
                            <p><FontAwesomeIcon icon={faScroll} /> Quests: {info.step.requirement.questNames.join(", ")}</p>
                            )}
                            {info.step.requirement?.questStats?.length > 0 && (
                            <p><FontAwesomeIcon icon={faChartBar} /> Stats: {info.step.requirement.questStats.join(", ")}</p>
                            )}
                        </div>
                        </div>
                    ))}
                    </motion.div>
                )}
            </AnimatePresence>

        </>
    );
};

export default CurrentStepPopup;
