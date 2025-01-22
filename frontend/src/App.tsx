import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CreateAppointment from './components/CreateAppointment';
import ListAppointments from './components/ListAppointments';
import ProfileEmployer from './components/ProfileEmployer';
import ProfileClient from './components/ProfileClient';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<h1>Bienvenue dans l'application</h1>} />
          <Route path="/create" element={<CreateAppointment />} />
          <Route path="/list" element={<ListAppointments />} />
          <Route path="/employer/profile" element={<ProfileEmployer />} />
          <Route path="/client/profile" element={<ProfileClient />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
