import React, { useEffect, useState } from "react";
import { FaDiscord } from "react-icons/fa";

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState([]);

  // Fetch posts from WordPress on mount
  useEffect(() => {
    fetch("https://relifeblogs.com/wp-json/wp/v2/posts?per_page=100") // adjust URL
      .then((response) => response.json())
      .then((data) => setPosts(data))
      .catch((error) =>
        console.error("Error fetching WordPress posts:", error)
      );
  }, []);

  // Filter posts based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.title.rendered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.rendered.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const joinDiscord = () => {
    window.open(
      "https://discord.gg/5Pzp4nMxkF",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="grid lg:grid-cols-5 md:grid-cols-4 container mx-auto p-6">
      <div className="col-start-2 col-span-4 flex items-center justify-center flex-col">
        <h1 className="font-bold mb-2 text-center text-white font-solo tracking-widest text-5xl">
          Need Help?
        </h1>
        <p className="text-center text-white">
          Search for answers or browse through common topics.
        </p>
        <button
          onClick={joinDiscord}
          className="flex font-solo mb-6 tracking-widest items-center justify-center gap-2 px-4 py-2 my-2 bg-[#5865F2] text-white font-medium text-lg rounded-md shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
        >
          <FaDiscord size={24} />
          Ask Our Community
        </button>
        <div className="search-bar flex justify-center mb-6 w-full">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="help-topics w-full">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="mb-4 p-4 rounded shadow-sm bg-gray-800"
              >
                <h2 className="font-semibold text-white text-lg">
                  {post.title.rendered}
                </h2>
                <div
                  className="text-white mt-2"
                  dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                />
                <p className="text-text">...</p>

                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Read more
                </a>
              </div>
            ))
          ) : (
            <p className="text-center text-white">
              No results found. Try searching for something else.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HelpPage;
