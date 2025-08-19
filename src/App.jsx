import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import NotificationProvider from '@/components/NotificationProvider';


function App() {
  return (
<NotificationProvider>
    <>
      <Pages />
      <Toaster />
    </>
    </NotificationProvider>
  )
}

export default App 