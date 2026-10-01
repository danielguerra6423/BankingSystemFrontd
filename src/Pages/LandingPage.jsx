
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import BankCard from '../components/BankCard'
import Whysection from '../components/Whysection'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar
        onNavigateLogin={() => navigate('/login')}
        onNavigateRegister={() => navigate('/registro')}
      />
      <Hero
        onNavigateLogin={() => navigate('/login')}
        onNavigateRegister={() => navigate('/registro')}
      />
      <BankCard />
      <Whysection />
      <Footer />

    </>
  )
}
