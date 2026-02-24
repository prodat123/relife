import React from "react";

const getErrorMessage = (error) => {
  if (!error) return "An unknown error occurred.";

  console.log(error);

  if (typeof error === "string") return error;


  const code = error.code || error.status || error.statusCode;
  const message = error.message;

  if (typeof code === "string") {
    switch (code) {
      case "auth/user-not-found":
        return "User not found. Please check your email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "ERR_BAD_REQUEST":
        return "Incomplete input. You might have been signed out! Try logging back in or refreshing.";
      case "permission-denied":
        return "You do not have permission to access this resource.";
      default:
        return message || `An unexpected error occurred (code: ${code}).`;
    }
  }



  if (typeof code === "number") {
    switch (code) {
      case 400:
        return "Bad request. Please check your input.";
      case 401:
        return "Unauthorized access. Please log in.";
      case 403:
        return "Forbidden. You don't have access.";
      case 404:
        return "Resource not found.";
      case 500:
        return "Internal server error. Please try again later.";
      case 503:
        return "Service unavailable. Please try again later.";
      default:
        return message || `Error ${code}: Something went wrong.`;
    }
  }

  return message || "An unknown error occurred.";
};

const shouldShowRelogin = (error) => {
  const code = error?.code || error?.status;
  return code === "auth/wrong-password" || code === "auth/user-not-found" || code === 401;
};

const shouldShowRefresh = (error) => {
  const code = error?.code || error?.status;
  return [500, 503, "auth/network-request-failed"].includes(code);
};

const ErrorDisplay = ({ error, onRelogin }) => {
  if (!error) return null;

  const message = getErrorMessage(error);

  return (
    <div className="max-w-xl mx-auto mt-4 p-4 border-l-4 border-red-500 bg-red-100 text-red-700 rounded shadow space-y-3">
      <div>
        <strong className="block font-semibold mb-1">Error</strong>
        <p>{message}</p>
        <p className="text-xs my-4">({error.code})</p>
      </div>

      <div className="flex gap-3">
          <button
            onClick={() => (onRelogin ? onRelogin() : (window.location.href = "/login"))}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
          >
            Login Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        
      </div>
    </div>
  );
};

export default ErrorDisplay;
