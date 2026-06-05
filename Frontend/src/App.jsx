import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "../src/Pages/Login";
import Signup from "../src/Pages/Signup";
import LandingPage from "../src/Pages/LandingPage";
import PagesWithNavbar from "./Components/PagesWithNavbar";
import HomePage from "../src/Pages/HomePage";
import Resources from "../src/Pages/Resources";
import Saved from "../src/Pages/Saved";
import Trash from "../src/Pages/Trash";
import Profile from "../src/Pages/Profile";
import Viewer from "../src/Pages/Viewer";
import Focus from "../src/Pages/Focus";
import { TimerProvider } from "./context/TimerContext";
import FloatingTimer from "./Components/FloatingTimer";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route element={<PagesWithNavbar />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/archives" element={<Resources />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/bin" element={<Trash />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/focus" element={<Focus />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <TimerProvider>
        <FloatingTimer />
        <AnimatedRoutes />
      </TimerProvider>
    </Router>
  );
}

export default App;
