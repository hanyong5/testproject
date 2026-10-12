import { Link, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Subpage1 from "./pages/Subpage1";
import Header from "./pages/Header";
import About from "./pages/About";
import Product from "./pages/Product";
import Board from "./pages/Board";
import BoardView from "./pages/BoardView";
import MapPage from "./pages/Map";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Footer from "./components/Footer";
import "./pages/Product.css";
import "./pages/Portal.css";

function App() {
  const { pathname } = useLocation();
  return (
    <div className="nexis-page min-h-screen">
      <Header />
      <main className={pathname === "/map" ? "relative isolate min-h-[calc(100dvh-80px)] overflow-hidden" : pathname.startsWith("/board/") || ["/", "/about", "/product", "/board", "/login", "/signup"].includes(pathname) ? "" : "mx-auto max-w-5xl px-6 py-12"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/product" element={<Product />} />
          <Route path="/board" element={<Board />} />
          <Route path="/board/:id" element={<BoardView />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/sub01" element={<Subpage1 />} />
          <Route path="*" element={
            <section className="space-y-4">
              <h1 className="text-3xl font-bold">페이지를 찾을 수 없습니다</h1>
              <Link to="/" className="text-blue-700 dark:text-blue-300 underline">Home으로 이동</Link>
            </section>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
