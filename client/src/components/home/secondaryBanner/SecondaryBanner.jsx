import { Link } from "react-router-dom";

const SecondaryBanner = ({ image, imageMobil, zipFile ,baseURL}) => {


  // This line logs the values of the props passed to the SecondaryBanner component.
  // It helps in debugging by showing the current values of image, imageMobil, zipFile, and baseURL in the console.
  console.log("999 -> ", image, imageMobil, zipFile, baseURL);


  return (
    <div className="pb-3 md:py-3">
      <Link to={zipFile} target={zipFile ? "_blank" : ""} download={zipFile}>
        <img className="hidden md:block" src={`${baseURL}${image}`} alt="" />
        <img className="md:hidden rounded-2xl" src={imageMobil} alt="" />
      </Link>
    </div>
  );
};

export default SecondaryBanner;
