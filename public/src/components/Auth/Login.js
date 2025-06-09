import { Link } from "react-router-dom";
import styles from "./Auth.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import LoaderForAuth from "../Loader/LoaderForAuth";
import blogLogo from "../../media/bloglogo.png";

const apiUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:3030";
const domain = process.env.REACT_APP_DOMAIN || "localhost";

const Login = (propes) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  let data = state?.message || "";

  const [inputData, setInputData] = useState({
    email: "",
    password: "",
  });

  const [emailError, setEmailError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [isError, setIsError] = useState(true);
  const [message, setMessage] = useState("");
  const [isLoader, setIsLoader] = useState(false);

  const inputDataHandler = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmailError(false);
    }
    if (name === "password") {
      setPassError(false);
    }

    setInputData((pre) => {
      return { ...pre, [name]: value };
    });

    setIsError(false);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsError(false);
    setMessage("");

    // Validate input
    if (!inputData.email.includes("@") || inputData.email.length < 8) {
      setEmailError(true);
      setMessage("Please enter a valid email address");
      return;
    }
    if (inputData.password.length < 6) {
      setPassError(true);
      setMessage("Password must be at least 6 characters long");
      return;
    }

    setIsLoader(true);
    const url = apiUrl + "/auth/login";

    try {
      console.log('Attempting login for:', inputData.email);
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          email: inputData.email,
          password: inputData.password,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = {};
      }
      console.log('Login response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (!response.ok) {
        console.error('Server error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        if (data.error === 'yes' && data.errors) {
          if (data.errors.message === "Please verify your email before logging in") {
            navigate("/signup", { 
              state: { 
                message: "Please verify your email before logging in. Check your email for the verification code." 
              } 
            });
            return;
          }
          // Show all error details
          let errorMessage = data.errors.message || '';
          if (data.errors.details) errorMessage += `\nDetails: ${data.errors.details}`;
          if (data.errors.stack) errorMessage += `\nStack: ${data.errors.stack}`;
          throw new Error(errorMessage || 'Server error occurred');
        }
        // If no error details, show raw response
        throw new Error(`Server error (${response.status}): ${response.statusText}\n${JSON.stringify(data)}`);
      }

      if (data.message === "login done") {
        console.log('Login successful, setting user data');
        localStorage.setItem("isLogin", "yes");
        if (data.user) {
          localStorage.setItem("userName", data.user.name);
        }
        propes.isLogin(true);
        navigate("/");
      } else {
        throw new Error("Server response was not as expected");
      }
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      setIsError(true);
      setMessage(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoader(false);
    }
  };

  return (
    <div className={styles["login-main"]}>
      <div className={styles["login-sub"]}>
        <div className={styles["title"]}>
          <Link to="/">
            <img src={blogLogo} alt="logo"></img>
          </Link>
          <Link to="/">
            <h3>
              Blog<span>Sp</span>ot
            </h3>
          </Link>
        </div>
        <h3 className={styles["login"]}>Login</h3>
        <p className={styles["signup"]}>
          Doesn't have account yet?
          <Link to="/signup">
            <span>Sign Up</span>
          </Link>
        </p>
        <form method="post" onSubmit={onSubmitHandler}>
          <div className={styles["input-section"]}>
            <div
              className={`${styles["email"]} ${
                emailError ? styles["invalid"] : ""
              }`}
            >
              <label htmlFor="email">Email Address</label>
              <input
                onChange={inputDataHandler}
                type="email"
                name="email"
                value={inputData.email}
                autoComplete="username"
                placeholder="your@example.com"
                id="email"
              ></input>
            </div>
            <div
              className={`${styles["password"]} ${
                passError ? styles["invalid"] : ""
              }`}
            >
              <label htmlFor="pass">Password</label>
              <input
                onChange={inputDataHandler}
                type="password"
                name="password"
                autoComplete="current-password"
                value={inputData.password}
                placeholder="Enter 6 character or more "
                id="pass"
              ></input>
              <Link to="/forgotpassword">
                <p className={styles["forgot"]}>Forgot Password</p>
              </Link>
            </div>
          </div>
          {isLoader ? (
            <button className={styles["btn"]} type="button" disabled>
              <LoaderForAuth />
            </button>
          ) : (
            <button className={styles["btn"]} type="submit">
              Login
            </button>
          )}
        </form>
        {isError && <p className={styles["message"]}>{message}</p>}
        {data.length > 4 ? (
          <p className={styles["verify-message"]}>{data}</p>
        ) : (
          ""
        )}
      </div>

      <div className={styles["design"]}></div>
    </div>
  );
};

export default Login;
