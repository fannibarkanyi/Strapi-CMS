import { useEffect } from 'react'
import './App.css'
import { strapiClient } from './tools/strapiClient';

function App() {
  const [clubs, setClubs] = useState<Data.ContentType<"api::club.club">[]>([])

useEffect(() => {
  fetch("http://localhost:3001/api/articles")
    .then((response) => response.json())
    .then((data) =>console.log(data))
}, []);

  const login = async () => {
    await strapiClient.login("fannibarkanyi@gmail.com", "Kurvaanyad67")
  }

  const fetchClubs = async () => {
    const response = await strapiClient.get<Data.ContentType<"api::club.club">[]>("/api/clubs")
    console.log(response)
  }

  return (
    <>
      <button onClick={login}>Login</button>
      <button onClick={fetchClubs}>Fetch clubs</button>
    </>
  )
}

export default App
