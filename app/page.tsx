import LoginForm from './components/LoginForm'
import ImageSlideshow from './components/ImageSlideshow'

export default function Home() {
  return (
    <div className="login-container">
      <ImageSlideshow />
      <LoginForm />
    </div>
  )
}
