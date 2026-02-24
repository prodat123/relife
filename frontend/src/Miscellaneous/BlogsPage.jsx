import React, { useEffect, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';

// Function to truncate text to a specific length
const truncateText = (text, length) => {
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, length)}...`;
};

function BlogsPage() {
  // State to hold fetched posts
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('https://relifeblogs.com/wp-json/wp/v2/posts');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();

        // Fetch featured image for each post
        const postsWithImages = await Promise.all(
          data.map(async (post) => {
            if (post.featured_media) {
              const mediaResponse = await fetch(
                `https://relifeblogs.com/wp-json/wp/v2/media/${post.featured_media}`
              );
              const mediaData = await mediaResponse.json();
              return { ...post, featured_image: mediaData.source_url };
            }
            return post; // If no featured image, return post without change
          })
        );
        
        setPosts(postsWithImages); // Set the posts with images
      } catch (error) {
        setError(error.message); // Handle error if fetching fails
      } finally {
        setLoading(false); // Stop loading after the data is fetched
      }
    };

    fetchPosts();
  }, []); // Empty dependency array means this runs once on component mount

  // If still loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  // If error occurs
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl font-semibold text-red-500">Error: {error}</div>
      </div>
    );
  }

  const joinDiscord = async () => {
    window.open("https://discord.gg/5Pzp4nMxkF", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container mx-auto px-4 py-8 grid grid-cols-5">
      <div className='col-span-5 lg:col-span-4 lg:col-start-2'>
        <h1 className="text-4xl text-center font-extrabold text-white">Blogs</h1>
        <div className='flex flex-col items-center justify-center my-4'>
          <button
              onClick={joinDiscord}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#5865F2] text-white font-medium text-lg rounded-md shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
          >
              <FaDiscord size={24} />
              Join Our Community
          </button>   
        </div> 
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.length === 0 ? (
            <p className="text-lg text-gray-500">No blogs found</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-gray-700 text-white border p-4 rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                {post.featured_image && (
                  <img
                    src={post.featured_image}
                    alt={post.title.rendered}
                    className="w-full h-56 object-cover rounded-md mb-4"
                  />
                )}
                <h2 className="text-lg font-bold mb-2">{post.title.rendered}</h2>
                <div
                  className="text-sm mb-4"
                  dangerouslySetInnerHTML={{
                    __html: truncateText(post.excerpt.rendered, 150), // Truncate description to 150 characters
                  }}
                />
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-500 font-semibold"
                >
                  Read more
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BlogsPage;
