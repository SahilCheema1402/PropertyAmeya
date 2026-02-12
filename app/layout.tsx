import type { Metadata } from "next";
import StoreProvider from "../app/_helpers/storeProvider";
import "react-datepicker/dist/react-datepicker.css";
import "./global.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from "./_components/loader";
import Head from 'next/head';


export const metadata: Metadata = {
  title: "Property 360",
  description: "Property 360 CRM Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
        <link rel="icon" href="/images/adaptive-icon.png" />
      </head>
     <body className={"w-screen h-screen overflow-auto"}>
     <StoreProvider>
          {children}
          <Loader />
          <ToastContainer/>
      </StoreProvider>
      </body>
    </html>
  );
}
