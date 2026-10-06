import { useGetHomeControlsQuery } from "@/redux/features/allApis/homeControlApi/homeControlApi";
import { useGetSocialLinksQuery } from "@/redux/features/allApis/socialLinksApi/socialLinksApi";
import { Link } from "react-router-dom";
import partner1 from "@/assets/images/partner1.png";
import partner2 from "@/assets/images/partner2.png";
import partner3 from "@/assets/images/partner3.png";
import facebookIcon from "@/assets/images/hover_btm-fb.svg";
import youtubeIcon from "@/assets/images/btm-yt.svg";
import instagramIcon from "@/assets/images/hover_btm-ig.svg";
import twitterIcon from "@/assets/images/btm-twitter.svg";
import telegramIcon from "@/assets/images/hover_btm-tlg.svg";
import nagadIcon from "@/assets/images/icon_footer_nagad_colour.svg";
import rocketIcon from "@/assets/images/icon_footer_rocket_colour.svg";
import BKashLogo from "@/assets/images/BKash-bKash-Logo.wine.svg";
import upayIcon from "@/assets/images/upay-logo-color-mobile-banking-app-icon-free-png.webp";
import gamingLicenseIcon from "../../../assets/gaming_license.png"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো

import porimoni from "../../../assets/porimoni.png"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো
import keyapayel from "../../../assets/keyapayel.png"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো
import miakhalifa from "../../../assets/miakhalifa.png"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো
import chan from "../../../assets/chan.png"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো

import officialBrandPartnerIcon from "../../../assets/dstgame.png"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো
import regulationsIcon from "../../../assets/regulations.svg"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো
import gamcareIcon from "../../../assets/gamcare.svg"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো
import ageLimitIcon from "../../../assets/age-limit.svg"; // ডামি পাথ, প্রকৃত পাথ দিয়ে রিপ্লেস করো

const Footer = () => {
  const { data: homeControls } = useGetHomeControlsQuery();
  const { data: socialLinks } = useGetSocialLinksQuery();
  const logo = homeControls?.find(
    (control) => control.category === "logo" && control.isSelected
  );

  return (
    <div className="bg-[rgb(216,216,216)] md:bg-[#333] pt-8 md:pt-14">
      <div className="container mx-auto px-4 sm:px-10 lg:px-24">
        {/* Desktop View */}
        <div className="border-t border-teal-50 md:flex gap-4 pt-10 hidden">
          {/* Left Side */}
          <div className="text-white w-1/2">
            <div className="max-w-[320px] space-y-5">
              <h4 className="text-base font-semibold">
                {import.meta.env.VITE_SITE_NAME} দক্ষিণ এশিয়ায় বিশ্বস্ত অনলাইন
                ক্যাসিনো | বাংলাদেশ, ভারত, নেপালে শুধুমাত্র
              </h4>
              <p className="text-sm font-bold">
                {import.meta.env.VITE_SITE_NAME} হল একটি অনলাইন ব্যাটিং
                কোম্পানি, যা বিস্তৃত পরিসরে বাজি এবং ক্যাসিনো বিকল্পগুলি অফার
                করে৷ 2021 সালে প্রতিষ্ঠিত, Site Name একটি ক্রিকেট এক্সচেঞ্জ
                প্ল্যাটফর্ম হিসাবে শুরু হয়েছিল যা দক্ষিণ এশিয়ার বাজারে পরিবেশন
                করে৷ আমাদের লক্ষ্য হল আমাদের ব্যবহারকারীদের কাছে অনলাইন ক্যাসিনো
                বাজি ধরার প্রথম পছন্দ হওয়া। গ্রাহক সেবা এবং বিনোদনের ক্ষেত্রে
                শুধুমাত্র সেরাটাই প্রত্যাশা করুন!
              </p>
            </div>
          </div>
          {/* Right Side */}
          <div className="w-1/2 text-white space-y-6">
            <p className="text-base">অফিসিয়াল পার্টনার এবং স্পনসর</p>
            <div className="flex gap-8">
              <div>
                <img className="w-14" src={partner1} alt="Montreal Tigers" />
                <p className="text-sm font-semibold max-w-8 mt-2">
                  Montreal Tigers
                </p>
              </div>
              <div>
                <img className="w-14" src={partner2} alt="Colombo Strikers" />
                <p className="text-sm font-semibold max-w-8 mt-2">
                  Colombo Strikers
                </p>
              </div>
              <div>
                <img className="w-14" src={partner3} alt="Northern Warriors" />
                <p className="text-sm font-semibold max-w-8 mt-2">
                  Northern Warriors
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile View */}
        <div className="md:hidden text-center pt-6">
          {/* Logo */}
          <Link to="/" target="_blank">
            <img
              className="w-40 mx-auto"
              src={`${import.meta.env.VITE_BASE_API_URL}${logo?.image}`}
              alt="Site Logo"
            />
          </Link>
          {/* Domain */}
          <p className="text-sm text-black mt-4">
            {import.meta.env.VITE_SITE_NAME}
          </p>
          {/* Title */}
          <h4 className="text-base font-semibold text-green-600 mt-2">
            দক্ষিণ এশিয়ায় বিশ্বস্ত অনলাইন ক্যাসিনো
          </h4>
          {/* Description */}
          <p className="text-sm text-black mt-2 max-w-xs mx-auto">
            {import.meta.env.VITE_SITE_NAME} হল একটি অনলাইন ব্যাটিং কোম্পানি, যা
            বিস্তৃত পরিসরে বাজি এবং ক্যাসিনো বিকল্পগুলি অফার করে।
          </p>
          {/* Green HR Line */}
          <hr className="border-4 border-green-600 my-6" />
          {/* Social Media Section */}
          <p className="text-sm text-black mb-4">আমাদের অনলাইনে সম্পর্কিত</p>
          <div className="flex justify-center gap-4">
            {socialLinks?.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                <img className="w-8 hover:filter hover:grayscale transition-all duration-500" src={facebookIcon} alt="Facebook" />
              </a>
            )}
            {socialLinks?.youtube && (
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                <img className="w-8 transition-all duration-500" src={youtubeIcon} alt="YouTube" />
              </a>
            )}
            {socialLinks?.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <img className="w-8 hover:filter hover:grayscale transition-all duration-500" src={instagramIcon} alt="Instagram" />
              </a>
            )}
            {socialLinks?.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                <img className="w-8 transition-all duration-500" src={twitterIcon} alt="Twitter" />
              </a>
            )}
            {socialLinks?.telegram && (
              <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer">
                <img className="w-8 hover:filter hover:grayscale transition-all duration-500" src={telegramIcon} alt="Telegram" />
              </a>
            )}
          </div>
          {/* Payment Methods Section */}
          <p className="text-sm text-black mt-6 mb-4">আমাদের পরিশোধ পদ্ধতি</p>
          <div className="flex justify-center gap-4">
            <Link>
              <img
                className="w-14 hover:filter hover:grayscale transition-all duration-500"
                src={BKashLogo}
                alt="bKash"
              />
            </Link>
            <Link>
              <img
                className="w-14 hover:filter hover:grayscale transition-all duration-500"
                src={nagadIcon}
                alt="Nagad"
              />
            </Link>
            <Link>
              <img
                className="w-10 hover:filter hover:grayscale transition-all duration-500"
                src={rocketIcon}
                alt="Rocket"
              />
            </Link>
            <Link>
              <img
                className="w-10 hover:filter hover:grayscale transition-all duration-500"
                src={upayIcon}
                alt="Upay"
              />
            </Link>
          </div>
          {/* Additional Mobile-Only Section: Brand Ambassadors, Gaming License, Official Brand Partner, Responsible Gaming */}
          <div className="flex flex-col mb-6 mt-5 ">
            {/* Brand Ambassadors */}
            <div className="mb-6 p-4 rounded-lg">
              <h3 className="flex items-center justify-center font-medium mb-3 text-black text-xs sm:text-sm">
                Brand Ambassadors
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
                <div className="flex flex-col items-center text-center">
                  <img
                    alt="Mia Khalifa"
                    className="h-8 sm:h-10 object-contain mb-1"
                    src={miakhalifa}
                  />
                  <p className="text-[10px] sm:text-xs">Mia Khalifa</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    2024 - 2028
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <img
                    alt="Porimoni"
                    className="h-8 sm:h-10 object-contain mb-1"
                    src={porimoni}
                  />
                  <p className="text-[10px] sm:text-xs">Porimoni</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    2023 - 2024
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <img
                    alt="Chan Samart"
                    className="h-8 sm:h-10 object-contain mb-1"
                    src={chan}
                  />
                  <p className="text-[10px] sm:text-xs">Chan Samart</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    2024 - 2025
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <img
                    alt="Keya Akter Payel"
                    className="h-8 sm:h-10 object-contain mb-1"
                    src={keyapayel}
                  />
                  <p className="text-[10px] sm:text-xs">Keya Akter Payel</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">2025</p>
                </div>
              </div>
            </div>
            {/* Gaming License */}
            <div className="flex flex-col items-center mb-4">
              <h3 className="font-medium mb-3 text-black text-xs sm:text-sm">
                Gaming License
              </h3>
              <div className="flex space-x-3 flex-wrap justify-center">
                <img
                  alt="Gaming License"
                  className="h-12 sm:h-8 object-contain"
                  src={gamingLicenseIcon}
                />
              </div>
            </div>
            {/* Official Brand Partner */}
            <div className="flex flex-col items-center mb-4">
              <h3 className="font-medium mb-3 text-black text-xs sm:text-sm">
                Official Brand Partner
              </h3>
              <div className="flex justify-center">
                <img
                  className="h-8 sm:h-10 object-contain"
                  src={officialBrandPartnerIcon}
                  alt="Official Brand Partner"
                />
              </div>
            </div>
            {/* Responsible Gaming */}
            <div className="flex flex-col items-center">
              <h3 className="font-medium mb-3 text-black text-xs sm:text-sm">
                Responsible Gaming
              </h3>
              <div className="flex space-x-3 flex-wrap justify-center">
                <img
                  alt="Regulations"
                  className="h-5 sm:h-6"
                  src={regulationsIcon}
                />
                <img alt="Gamcare" className="h-5 sm:h-6" src={gamcareIcon} />
                <img
                  alt="Age Limit"
                  className="h-5 sm:h-6"
                  src={ageLimitIcon}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Desktop View - Certified and Responsible Gaming */}
        <div className="md:py-10 flex gap-4 border-t md:border-none border-teal-50 md:block hidden">
          <div className="w-1/2 pt-6 md:pt-0">
            <p className="text-sm sm:text-base mb-4 text-black md:text-white">
              প্রত্যয়িত বই
            </p>
            <Link to="/" target="_blank">
              <img
                className="w-40 md:w-44 lg:w-52"
                src={`${import.meta.env.VITE_BASE_API_URL}${logo?.image}`}
                alt="Site Logo"
              />
            </Link>
          </div>
          <div className="w-1/2 pt-6 md:pt-0">
            <p className="text-sm sm:text-base mb-4 text-black md:text-white">
              দায়িত্বশীল গেমিং
            </p>
            <div className="flex gap-4">
              <img
                className="w-8 sm:w-9 md:w-11"
                src={ageLimitIcon}
                alt="18+"
              />
              <img
                className="w-8 sm:w-9 md:w-11"
                src={gamcareIcon}
                alt="GamCare"
              />
            </div>
          </div>
        </div>
        {/* Desktop View - Payment Methods and Social Media */}
        <div className="py-6 md:py-10 text-white flex gap-4 md:border-t border-teal-50 hidden md:flex">
          <div className="w-1/2">
            <p className="text-base mb-4">মূল্যপরিশোধ পদ্ধতি</p>
            <div className="flex gap-4">
              <Link>
                <img
                  className="w-14 hover:filter hover:grayscale transition-all duration-500"
                  src={BKashLogo}
                  alt="bKash"
                />
              </Link>
              <Link>
                <img
                  className="w-14 hover:filter hover:grayscale transition-all duration-500"
                  src={nagadIcon}
                  alt="Nagad"
                />
              </Link>
              <Link>
                <img
                  className="w-10 hover:filter hover:grayscale transition-all duration-500"
                  src={rocketIcon}
                  alt="Rocket"
                />
              </Link>
              <Link>
                <img
                  className="w-14 hover:filter hover:grayscale transition-all duration-500"
                  src={upayIcon}
                  alt="Upay"
                />
              </Link>
            </div>
          </div>
          <div className="w-1/2">
            <p className="text-sm sm:text-base mb-2 md:mb-4 text-black md:text-white">
              আমাদের অনুসরণ করো
            </p>
            <div className="flex gap-4">
              {socialLinks?.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                  <img className="w-8 sm:w-9 lg:w-11 hover:filter hover:grayscale transition-all duration-500" src={facebookIcon} alt="Facebook" />
                </a>
              )}
              {socialLinks?.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                  <img className="w-8 sm:w-9 lg:w-11 transition-all duration-500" src={youtubeIcon} alt="YouTube" />
                </a>
              )}
              {socialLinks?.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                  <img className="w-8 sm:w-9 lg:w-11 hover:filter hover:grayscale transition-all duration-500" src={instagramIcon} alt="Instagram" />
                </a>
              )}
              {socialLinks?.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                  <img className="w-8 sm:w-9 lg:w-11 transition-all duration-500" src={twitterIcon} alt="Twitter" />
                </a>
              )}
              {socialLinks?.telegram && (
                <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer">
                  <img className="w-8 sm:w-9 lg:w-11 hover:filter hover:grayscale transition-all duration-500" src={telegramIcon} alt="Telegram" />
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="text-center mt-5 text-sm sm:text-base md:mt-4 pb-8 text-black md:text-white">
          কপিরাইট © 2025 {import.meta.env.VITE_SITE_NAME}
        </p>
      </div>
    </div>
  );
};

export default Footer;
