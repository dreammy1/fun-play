import { IoMdHome } from "react-icons/io";

import {
  IoGameController,
  IoLogoWechat,
  IoSettingsSharp,
} from "react-icons/io5";

import { FaAffiliatetheme, FaUsers } from "react-icons/fa";
import { PiCashRegister } from "react-icons/pi";
import { GiGamepadCross, GiRibbonMedal } from "react-icons/gi";
import { SlGameController } from "react-icons/sl";
import { BsBank, BsFront, BsPiggyBank, BsShop } from "react-icons/bs";
import { useState } from "react";
import DashboardMobileMenu from "../components/dashboard/DashboardMobileMenu";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const DashboardLayout = () => {
  const [open, setOpen] = useState(true);
  const menuItems = [
    { name: "Dashboard", icon: <IoMdHome />, path: "/dashboard" },
    {
      name: "Users",
      icon: <FaUsers />,
      path: "/dashboard/all-user",
    },

    {
      name: "Cash Agent",
      icon: <PiCashRegister />,
      submenu: [
        { name: "All Agents", path: "" },
        { name: "KYC", path: "" },
        {
          name: "Payment Requests",
          path: "",
        },
      ],
    },
    {
      name: "Affiliators",
      icon: <FaAffiliatetheme />,

      submenu: [
        { name: "All Affiliates", path: "" },
        { name: "All Affiliate Links", path: "" },
      ],
    },
    {
      name: "Games Control",
      icon: <IoGameController />,
      submenu: [
        { name: "Add Categories", path: "/dashboard/add-category" },
        { name: "Add Game", path: "/dashboard/add-game" },
        // { name: "Active Games", path: "" },
        // { name: "Inactive Games" },
      ],
    },
    // {
    //   name: "Games Api key",
    //   icon: <GiGamepadCross />,
    //   submenu: [
    //     { name: "Sprots Live TV", path: "/dashboard/games-api/sports-live-tv" },
    //     { name: "BetFair API", path: "/dashboard/games-api/betfair-api" },
    //     {
    //       name: "Sports Radar API",
    //       path: "/dashboard/games-api/sports-radar-api",
    //     },
    //     { name: "Odds Jam API", path: "/dashboard/games-api/odds-jam-api" },
    //     {
    //       name: "Bet Construct API",
    //       path: "/dashboard/games-api/bet-construct-api",
    //     },
    //     { name: "Kambi API", path: "/dashboard/games-api/kambi-api" },
    //     { name: "Pinnacle API", path: "/dashboard/games-api/pinnacle-api" },
    //     { name: "SoftSwiss API", path: "/dashboard/games-api/softswiss-api" },
    //     { name: "Betradar API", path: "/dashboard/games-api/betradar-api" },
    //     { name: "Evolution API", path: "/dashboard/games-api/evolution-api" },
    //     {
    //       name: "Pragmatic Play API",
    //       path: "/dashboard/games-api/pragmatic-play-api",
    //     },
    //     { name: "Playtech API", path: "/dashboard/games-api/playtech-api" },
    //     { name: "NetEnt API", path: "/dashboard/games-api/netent-api" },
    //     {
    //       name: "Betsoft Gaming API",
    //       path: "/dashboard/games-api/betsoft-gaming-api",
    //     },
    //   ],
    // },
    {
      name: "Bonuses",
      icon: <GiRibbonMedal />,
      submenu: [
        { name: "Happy Hours" },
        { name: "Deposit Bonuses" },
        { name: "Refer Bonuses", path: "/dashboard/refer-bonuses" },
        { name: "Welcome Bonuses", path: "/dashboard/welcome-bonuses" },
      ],
    },
    {
      name: "Game History",
      icon: <SlGameController />,
      submenu: [{ name: "All Game History", path: "/dashboard/gameHistory" }],
    },
    { name: "Game News", icon: <BsShop />, path: "/dashboard/game-news" },
    {
      name: "Frontend",
      icon: <BsFront />,
      submenu: [
        { name: "Home Control", path: "/dashboard/home-control" },
        { name: "Social Media", path: "/dashboard/social-links" },
        { name: "Promotions" },
        { name: "Pages" },
        { name: "FAQ" },
        { name: "Sponsorship" },
        { name: "Brand Ambassador" },
      ],
    },
    {
      name: "Banking Deposit",
      icon: <BsPiggyBank />,
      submenu: [
        { name: "Deposit Promotion", path: "/dashboard/depositPromotion" },
        { name: "Deposit Method", path: "/dashboard/depositmethod" },
        { name: "Deposit History", path: "/dashboard/DepositHistory" },
      ],
    },
    {
      name: "Banking Withdraw",
      icon: <BsBank />,
      submenu: [
        { name: "Withdraw Method", path: "/dashboard/withdrawMethods" },
        { name: "Withdraw History", path: "/dashboard/WithdrawalHistory" },
        { name: "Withdraw Setting", path: "/dashboard/withdraw-setting" },
      ],
    },
    {
      name: "Opay Setting",
      icon: <IoSettingsSharp />,
      submenu: [
        { name: "Opay Api", path: "/dashboard/opay/api" },
        { name: "Device Monitoring", path: "/dashboard/opay/devices" },
        { name: "Opay Deposit", path: "/dashboard/opay-deposit" },
      ],
    },
    {
      name: "Settings",
      icon: <IoSettingsSharp />,
      submenu: [
        { name: "Big Win Alert" },
        { name: "IP Activity Log" },
        { name: "New Admin & Permission" },
        { name: "Auto Payment Gateway" },
        { name: "OTP SMS System" },
        { name: "E-mail notifications" },
        { name: "Support", path: "https://oraclesoft.org" },
        { name: "ai detector Security" },
        { name: "Commission", path: "/dashboard/commissionsetting" },
      ],
    },
    {
      name: "Oracle Technology",
      icon: <IoLogoWechat />,
      submenu: [
        { name: "Instant Support" },
        { name: "Normal Support" },
        { name: "Permissions" },
        { name: "Notice" },
        { name: "About Us" },
        { name: "Contact Us" },
      ],
    },
  ];
  return (
    <div className="flex">
      {/* DashboardSidebar */}
      <DashboardSidebar open={open} setOpen={setOpen} menuItems={menuItems} />
      <div
        className={`flex-1 h-screen overflow-y-auto duration-300 ${
          !open ? "md:pl-16" : "md:pl-64"
        }`}
      >
        <DashboardMobileMenu open={open} menuItems={menuItems} />
        <div className="mt-[62px] md:mt-14 p-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
