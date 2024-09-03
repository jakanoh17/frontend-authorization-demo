import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Ducks from "./Ducks";
import Login from "./Login";
import MyProfile from "./MyProfile";
import Register from "./Register";
import ProtectedRoute from "./ProtectedRoute";
import AppContext from "../contexts/AppContext";
import "./styles/App.css";
import * as auth from "../utils/auth";
import { getToken, setToken } from "../utils/token";
import * as api from "../utils/api";

function App() {
  const [userData, setUserData] = useState({ username: "", email: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  // Invoke the hook. It's necessary to invoke the hook in both
  // components.
  const location = useLocation();

  const handleRegistration = ({
    username,
    email,
    password,
    confirmPassword,
  }) => {
    if (password === confirmPassword) {
      auth
        .register(username, password, email)
        .then(() => {
          // Navigate user to login page.
          navigate("/login");
        })
        .catch(console.error);
    }
  };

  // handleLogin accepts one parameter: an object with two properties.
  const handleLogin = ({ username, password }) => {
    // If username or password empty, return without sending a request.
    if (!username || !password) {
      return;
    }

    // We pass the username and password as positional arguments. The
    // authorize function is set up to rename `username` to `identifier`
    // before sending a request to the server, because that is what the
    // API is expecting.
    auth
      .authorize(username, password)
      .then((data) => {
        // Verify that a jwt is included before logging the user in.
        if (data.jwt) {
          setToken(data.jwt);
          setUserData(data.user); // save user's data to state
          setIsLoggedIn(true); // log the user in

          // After login, instead of navigating always to /ducks,
          // navigate to the location that is stored in state. If
          // there is no stored location, we default to
          // redirecting to /ducks.
          const redirectPath = location.state?.from?.pathname || "/ducks";
          navigate(redirectPath);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    const jwt = getToken();

    if (!jwt) {
      return;
    }

    // Call the function, passing it the JWT.
    api.getUserInfo(jwt).then(({ username, email }) => {
      // If the response is successful, log the user in, save their
      // data to state, and navigate them to /ducks.
      setIsLoggedIn(true);
      setUserData({ username, email });
      // Remove the call to the navigate() hook: it's not
      // necessary anymore.
      //      navigate("/ducks");
    });
  }, []);

  return (
    // We are passing an object containing isLoggedIn as the value
    // of the context provider.
    <AppContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <Routes>
        <Route
          path="/ducks"
          element={
            <ProtectedRoute>
              <Ducks />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfile userData={userData} />{" "}
            </ProtectedRoute>
          }
        />
        {/* Wrap our /register route in a ProtectedRoute. Make sure to
      specify the anoymous prop, to redirect logged-in users 
      to "/". */}
        <Route
          path="/login"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} anonymous>
              <div className="loginContainer">
                <Login handleLogin={handleLogin} />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            isLoggedIn ? (
              <Navigate to={"/ducks"} replace />
            ) : (
              //The "replace" keeps the browser history clean by replacing the current entry in the history stack instead of adding a new one
              <Navigate to={"/login"} replace />
            )
          }
        />
        {/* Wrap our /register route in a ProtectedRoute. Make sure to
      specify the anoymous prop, to redirect logged-in users 
      to "/". */}
        <Route
          path="/register"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} anonymous>
              <div className="registerContainer">
                <Register handleRegistration={handleRegistration} />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppContext.Provider>
  );
}

export default App;
