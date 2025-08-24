import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import NotificationProvider from '@/components/NotificationProvider';
import { useEffect } from 'react';


function App() {
  // Add this inside your component, after your existing useEffect hooks
useEffect(() => {
  // Google Analytics
  const GA_ID = 'G-X7BWLWPFYG'; // Replace with your actual Measurement ID
  
  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script1);
  
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  `;
  document.head.appendChild(script2);
}, []);


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