import React from 'react'
import { FaDiscord, FaInstagram, FaItchIo, FaTwitter, FaYoutube } from 'react-icons/fa'

function AboutUs() {
    const joinDiscord = async () => {
        window.open("https://discord.gg/5Pzp4nMxkF", "_blank", "noopener,noreferrer");
    };

    return (
        <div className='grid grid-cols-5 p-4'>
            <div className='col-start-1 md:col-start-3 lg:col-start-2 col-span-5 lg:col-span-4 w-full text-center'>
                <div className='text-4xl flex flex-col items-center justify-center font-bold text-white text-center'>
                    About Us
                    <button
                        onClick={joinDiscord}
                        className="flex items-center justify-center gap-2 px-4 py-2 my-2 bg-[#5865F2] text-white font-medium text-lg rounded-md shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
                    >
                        <FaDiscord size={24} />
                        Join Our Community
                    </button>    
                    
                    
                </div>
                
                <div className='bg-gray-800 p-4 mt-2 rounded-md text-white text-center'>
                    <h3 className='font-semibold text-3xl'>Max</h3>
                    <div className='mt-2'>Founder</div>
                    <div>Lead Programmer</div>
                    {/* <div className='flex items-center justify-center gap-3 mt-4 text-xl'>
                        <a href='https://eapple.itch.io'><FaInstagram /></a>
                        <a href='https://www.youtube.com/@EappleGames'><FaYoutube /></a>
                    </div> */}
                </div>
                <div className='bg-gray-800 p-4 mt-2 rounded-md text-white text-center'>
                    <h3 className='font-semibold text-3xl'>Eapple</h3>
                    <div className='mt-2'>Lead Designer</div>
                    <div>QA Tester</div>
                    <div className='flex items-center justify-center gap-3 mt-4 text-xl'>
                        <a href='https://eapple.itch.io' target='_blank'><FaItchIo /></a>
                        <a href='https://www.youtube.com/@EappleGames' target='_blank'><FaYoutube /></a>
                    </div>
                </div>
                <div className='bg-gray-800 p-4 mt-2 rounded-md text-white text-center'>
                    <h3 className='font-semibold text-3xl'>Pagu</h3>
                    <div className='mt-2'>Lead Artist</div>
                    {/* <div className='flex items-center justify-center gap-3 mt-4 text-xl'>
                        <a href='https://eapple.itch.io' target='_blank'><FaDiscord /></a>
                        <a href='https://www.youtube.com/@EappleGames' target='_blank'><FaYoutube /></a>
                    </div> */}
                </div>
            </div>
        </div>
    )
}

export default AboutUs