import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";

const MegaMenu = ({ items }) => {
  const { backgroundColor, mainColor , mainBackgroundColor } = useSelector((state) => state.themeColor);






  // Fallback colors
  const menuBackgroundColor = mainBackgroundColor || "#333333";
  const hoverColor = mainColor || "#FFCD03";



  


  return (
    <div className="container mx-auto" style={{ backgroundColor: menuBackgroundColor }}>
       <style>
        {`
          .menu-image:hover {
            transform: scale(1.1);
            box-shadow: 0 0 10px ${hoverColor};
          }
        `}
      </style>
      <div className="grid gap-8 grid-cols-5 px-4 sm:px-10 lg:px-24">
        {items?.map((item, index) => (
          <Link key={index} to={item.route}>
            <img
              className="w-28 transition-all duration-300 menu-image"
              src={item.image}
              alt={ (item.route.split("/").pop() || "Menu item")}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MegaMenu;