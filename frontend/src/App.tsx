import './styles/theme.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CreateAppointment from './components/CreateAppointment';
import ProfileEmployer from './components/ProfileEmployer';
import ProfileClient from './components/ProfileClient';
import Footer from './components/Footer';
import NavBar from './components/NavBar';
import Home from './components/Home';
import NotFound from './components/NotFound';
import Contact from './components/Contact';
import MentionsLegales from './components/MentionsLegales';
import Login from './components/Login';
import Signup from './components/Signup';  // ✅ Ajout de Signup

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <NavBar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateAppointment />} />
            <Route path="/employer/profile" element={<ProfileEmployer />} />
            <Route path="/client/profile" element={<ProfileClient />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />  {/* ✅ Ajout de la route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
