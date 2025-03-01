import React from "react";
import Head from "next/head";

const Home = () => {
  return (
    <div>
      <div className="logoContainer">
        <img src="/logo.png" alt="logo" />
      </div>

      <div className="menuSelectors">
        <h1>Our Delectable Menu</h1>
        <p>Indulge in a world of flavors with our extensive menu</p>
      </div>

      <ul>
        <li>
          <a
            href="/menu/early-bird"
            target="_blank"
          >
            Early Bird Special
          </a>
        </li>
        <li>
          <a
            href="https://cheery-cocada-347371.netlify.app/menu/ala-carte"
            target="_blank"
          >
            Ala Carte
          </a>
        </li>
        <li>
          <a
            href="https://cheery-cocada-347371.netlify.app/menu/christmas"
            target="_blank"
          >
            Christmas Special
          </a>
        </li>
        <li>
          <a
            href="https://cheery-cocada-347371.netlify.app/menu/drinks"
            target="_blank"
          >
            Drinks
          </a>
        </li>
        <li>
          <a
            href="https://cheery-cocada-347371.netlify.app/menu/caterer-menu"
            target="_blank"
          >
            Caterer's Menu
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Home;
