import React from "react";
import Head from "next/head";

import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Menus | By Kwiktable</title>
        <meta name="description" content="Kwiktable provide one tap menu creation and ordering experience" />
        <meta name="keywords" content="Menus, Kwiktable, Menu Creation, Ordering, Restaurant, Food" />
        <meta name="author" content="Kwiktable" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:url" content="https://kwiktable.com/seoImgs.png" />
        <meta property="og:image:secure_url" content="https://kwiktable.com/seoImgs.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Menus | By Kwiktable" />
        <meta property="twitter:description" content="Kwiktable provide one tap menu creation and ordering experience" />
        <meta property="twitter:image" content="https://kwiktable.com/seoImgs.png" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
