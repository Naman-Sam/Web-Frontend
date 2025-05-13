// Assume process.env.REACT_APP_BASE_URL is your backend URL.
const API_URL = process.env.REACT_APP_BASE_URL;

/**
 * Generates a session token containing device/browser information and a timestamp.
 * The token includes:
 *  • userAgent: (navigator.userAgent)
 *  • language: (navigator.language)
 *  • platform: (navigator.platform)
 *  • screenResolution: (formatted as "width x height")
 *  • timezoneOffset: (new Date().getTimezoneOffset())
 *  • sessionId: A unique session identifier (via crypto.randomUUID or fallback)
 *  • sessionPoint: A unique code to distinguish each active session (e.g. each tab)
 *  • generatedAt: Timestamp when the token was generated (Date.now())
 *
 * The session data is JSON-stringified and then Base64-encoded.
 *
 * @returns {string} The generated session token.
 */
function generateSessionToken() {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const timezoneOffset = new Date().getTimezoneOffset();

  const sessionId =
    (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2);

  const sessionPoint =
    (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2);

  const generatedAt = Date.now();
  
  const sessionData = {
    userAgent,
    language,
    platform,
    screenResolution,
    timezoneOffset,
    sessionId,
    sessionPoint,
    generatedAt,
  };

  return btoa(JSON.stringify(sessionData));
}

/**
 * A fetch wrapper that automatically adds custom authorization, login, and session headers,
 * along with a default "Content-Type: application/json" header on every request.
 *
 * For logged-in users, after successful login your backend stores a token in localStorage.
 * - For regular users, the token is stored under the key "token" and is in the format <USER_TOKEN_SECRET>::<userId>.
 * - For superusers, the token is stored under the key "superuserToken" and is in the format <USER_TOKEN_SECRET>::<superuserId>.
 *
 * For guests, a simple default token value ("public") is sent.
 *
 * Every request gets a session token ("ts") generated with generateSessionToken().
 *
 * @param {string} url - The URL to fetch.
 * @param {object} [options={}] - The fetch options object.
 * @returns {Promise<Response>} The fetch API promise.
 */
export async function wrapperFetch(url, options = {}) {
  // Ensure headers exist
  options.headers = options.headers || {};

  // Check for logged-in information: Either superuser or a regular user.
  const superuserId = localStorage.getItem("superuserId");
  const userId = localStorage.getItem("userId"); // Regular user's ID.
  const username = localStorage.getItem("username"); // Regular user's username.

  if (superuserId || (userId && username)) {
    // Mark the request as a logged-in one.
    options.headers["login"] = "true";

    // Prefer a superuser token if present.
    if (superuserId) {
      let superuserToken = localStorage.getItem("superuserToken");
      if (!superuserToken) {
        superuserToken = `${process.env.REACT_APP_USER_TOKEN_SECRET}::${superuserId}`;
        localStorage.setItem("superuserToken", superuserToken);
      }
      options.headers["authorization"] = superuserToken;
    } else {
      let userToken = localStorage.getItem("token");
      if (!userToken) {
        userToken = `${process.env.REACT_APP_USER_TOKEN_SECRET}::${userId}`;
        localStorage.setItem("token", userToken);
      }
      options.headers["authorization"] = userToken;
    }
  } else {
    // No logged-in user found: mark as public.
    options.headers["login"] = "false";
    options.headers["authorization"] = "public";
  }

  // Always attach a session token
  options.headers["ts"] = generateSessionToken();

  return fetch(url, options);
}
