import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Home from "../pages/home/home/Home";
import Login from "../pages/login/Login";
import Registration from "../pages/registration/Registration";
import Casino from "../pages/home/casino/Casino";
import Slot from "../pages/home/slot/Slot";
import TableGames from "@/pages/home/tableGames/TableGames";
import SportsBook from "@/pages/home/sportsBook/SportsBook";
import Fishing from "@/pages/home/fishing/Fishing";
import Crash from "@/pages/home/crash/Crash";
import Promotion from "@/pages/home/promotion/Promotion";
import Referral from "@/pages/home/referral/Referral";
import Cricket from "@/pages/home/cricket/Cricket";
import BettingPass from "@/pages/home/bettingPass/BettingPass";
import MegaMenu from "@/components/shared/megaMenu/MegaMenu";
import Faq from "@/pages/home/faq/Faq";
import Profile from "@/components/dashboard/profile/Profile";
import MyProfile from "@/components/dashboard/profile/myProfile/MyProfile";
import Inbox from "@/components/dashboard/profile/inbox/Inbox";
import Deposit from "@/components/dashboard/profile/deposit/Deposit";
import Withdrawal from "@/components/dashboard/profile/deposit/Withdrawal";
import Voucher from "@/components/dashboard/profile/deposit/Voucher";
import Rewards from "@/components/dashboard/profile/rewards/Rewards";
import PrivateRoute from "./PrivateRoute";
import DemoGame from "@/pages/home/DemoGame/DemoGame";
import DashboardLayout from "@/layout/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import HomeControl from "@/pages/dashboard/HomeControl";
import AdminRoute from "./AdminRoute";
import AddDepositMethods from "@/components/dashboard/Dashboard-Page/Add-Deposit-Methods/AddDepositMethods";
import DepositPromotion from "@/components/dashboard/Dashboard-Page/DepositPromotion/DepositPromotion";
import DepositHistory from "@/components/dashboard/Dashboard-Page/Deposit-History/DepositHistory";
import AddWithdrawMethods from "@/components/dashboard/Dashboard-Page/Add-Withdrow-Methods/AddWithdrowMethods";
import GameHistory from "@/components/dashboard/Dashboard-Page/Game-History/GameHistory";
import AdminLogin from "@/pages/AdminLogin";
import WithdrawalHistory from "@/components/dashboard/Dashboard-Page/Withdrawal-History/WithdrawalHistory";
import History from "./../components/dashboard/profile/history/History";
import AddCategories from "@/pages/dashboard/AddCategories";
import AddGame from "@/pages/dashboard/AddGame";
import SportsLiveTv from "@/components/dashboard/Dashboard-Page/GameAPI/SportsLiveTv";
import BetFairApi from "@/components/dashboard/Dashboard-Page/GameAPI/BetFairApi";
import SportsRadarApi from "@/components/dashboard/Dashboard-Page/GameAPI/SportsRadarApi";
import OddsJamApi from "@/components/dashboard/Dashboard-Page/GameAPI/OddsJamApi";
import BetConstructApi from "@/components/dashboard/Dashboard-Page/GameAPI/BetConstructApi";
import KambiApi from "@/components/dashboard/Dashboard-Page/GameAPI/KambiApi";
import PinnacleApi from "@/components/dashboard/Dashboard-Page/GameAPI/PinnacleApi";
import SoftSwissApi from "@/components/dashboard/Dashboard-Page/GameAPI/SoftSwissApi";
import BetradarApi from "@/components/dashboard/Dashboard-Page/GameAPI/BetradarApi";
import EvolutionApi from "@/components/dashboard/Dashboard-Page/GameAPI/EvolutionApi";
import PragmaticPlayApi from "@/components/dashboard/Dashboard-Page/GameAPI/PragmaticPlayApi";
import PlaytechApi from "@/components/dashboard/Dashboard-Page/GameAPI/PlaytechApi";
import NetEntApi from "@/components/dashboard/Dashboard-Page/GameAPI/NetEntApi";
import BetsoftGamingApi from "@/components/dashboard/Dashboard-Page/GameAPI/BetsoftGamingApi";
import AllUser from "@/components/dashboard/Dashboard-Page/Users/AllUser";
import UserDetails from "@/components/dashboard/Dashboard-Page/Users/UserDetails";
import ProfileAccount from "@/pages/home/profileAccount/profileAccount";
import BettingHistory from "@/components/dashboard/profile/BettingHistory/BettingHistory";
import WalletHistory from "@/components/dashboard/profile/WalletHistory/WalletHistory";
import AdminProfile from "@/pages/dashboard/AdminProfile";
import UploadGameAutomation from "@/pages/dashboard/UploadGameAutomation";
import WelcomeBonus from "@/pages/dashboard/bonuses/WelcomeBonus";
import ReferBonus from "@/pages/dashboard/bonuses/ReferBonus";
import WithdrawSetting from "@/pages/dashboard/withdrawSetting";
import GameNews from "@/components/dashboard/game-news/GameNews";
import JustDemoPage from "@/pages/home/justDemoPage/JustDemoPage";
import OpayApi from "@/pages/dashboard/opay/OpayApi";
import OpayDeposit from "@/pages/dashboard/OpayDeposit";
import DeviceMonitoring from "@/pages/dashboard/opay/DeviceMonitoring";
import SocialLinks from "@/pages/dashboard/SocialLinks";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
    
      {
        path: "/just-demo",
        element: <JustDemoPage />,
      },
      {
        path: "/livegame/:id",
        element: <DemoGame />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Registration />,
      },
      {
        path: "/cricket",
        element: <Cricket />,
      },
      {
        path: "/casino",
        element: <Casino />,
      },
      {
        path: "/slot",
        element: <Slot />,
      },
      {
        path: "/table-games",
        element: <TableGames />,
      },
      {
        path: "/sports-book",
        element: <SportsBook />,
      },
      {
        path: "/fishing",
        element: <Fishing />,
      },
      {
        path: "/crash",
        element: <Crash />,
      },
      {
        path: "/betting-pass",
        element: <BettingPass />,
      },
      {
        path: "/promotion",
        element: <Promotion />,
      },
      {
        path: "/referral",
        element: <Referral />,
      },
      {
        path: "/mega-menu",
        element: <MegaMenu />,
      },
      {
        path: "/faq",
        element: <Faq />,
      },
      {
        path: "/profile",
        element: (
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        ),
        children: [
          {
            path: "",
            element: <MyProfile />,
          },
          {
            path: "inbox",
            element: <Inbox />,
          },
          {
            path: "deposit",
            element: <Deposit />,
          },
          {
            path: "withdrawal",
            element: <Withdrawal />,
          },
          {
            path: "voucher",
            element: <Voucher />,
          },
          {
            path: "rewards",
            element: <Rewards />,
          },
          {
            path: "history",
            element: <History />,
          },
          {
            path: "BettingHistory",
            element: <BettingHistory />,
          },
          {
            path: "WalletHistory",
            element: <WalletHistory />,
          },
          {
            path: "profileAccount",
            element: <ProfileAccount />,
          },
        ],
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <AdminRoute>
        <DashboardLayout />
      </AdminRoute>
    ),
    children: [
      {
        path: "",
        element: <DashboardHome />,
      },
      {
        path: "refer-bonuses",
        element: <ReferBonus />,
      },
      { path: "home-control", element: <HomeControl /> },
      { path: "admin-profile", element: <AdminProfile /> },
      { path: "add-category", element: <AddCategories /> },
      { path: "add-game", element: <AddGame /> },
      { path: "opay/api", element: <OpayApi /> },
      { path: "opay-deposit", element: <OpayDeposit /> },
      { path: "opay/devices", element: <DeviceMonitoring /> },
      { path: "social-links", element: <SocialLinks /> },
      {
        path: "welcome-bonuses",
        element: <WelcomeBonus />,
      },
      {
        path: "depositmethod",
        element: <AddDepositMethods />, // Add the new route
      },

      {
        path: "depositPromotion",
        element: <DepositPromotion />, // Add the new route
      },
      {
        path: "DepositHistory",
        element: <DepositHistory />, // Add the new route
      },
      {
        path: "withdrawMethods",
        element: <AddWithdrawMethods />, // Add the new route
      },
      {
        path: "withdraw-setting",
        element: <WithdrawSetting />, // Add the new route
      },
      {
        path: "game-news",
        element: <GameNews />, // Add the new route
      },

      {
        path: "WithdrawalHistory",
        element: <WithdrawalHistory />, // Add the new route
      },
      {
        path: "uploadGameAutomation",
        element: <UploadGameAutomation />, // Add the new route
      },
      {
        path: "gameHistory",
        element: <GameHistory />, // Add the new route
      },
      {
        path: "games-api/sports-live-tv",
        element: <SportsLiveTv />, // Add the new route
      },
      {
        path: "games-api/betfair-api",
        element: <BetFairApi />, // Add the new route
      },
      {
        path: "games-api/sports-radar-api",
        element: <SportsRadarApi />, // Add the new route
      },
      {
        path: "games-api/odds-jam-api",
        element: <OddsJamApi />, // Add the new route
      },
      {
        path: "games-api/bet-construct-api",
        element: <BetConstructApi />, // Add the new route
      },
      {
        path: "games-api/kambi-api",
        element: <KambiApi />, // Add the new route
      },
      {
        path: "games-api/pinnacle-api",
        element: <PinnacleApi />, // Add the new route
      },
      {
        path: "games-api/softswiss-api",
        element: <SoftSwissApi />, // Add the new route
      },
      {
        path: "games-api/betradar-api",
        element: <BetradarApi />, // Add the new route
      },
      {
        path: "games-api/evolution-api",
        element: <EvolutionApi />, // Add the new route
      },
      {
        path: "games-api/pragmatic-play-api",
        element: <PragmaticPlayApi />, // Add the new route
      },
      {
        path: "games-api/playtech-api",
        element: <PlaytechApi />, // Add the new route
      },
      {
        path: "games-api/netent-api",
        element: <NetEntApi />, // Add the new route
      },
      {
        path: "games-api/betsoft-gaming-api",
        element: <BetsoftGamingApi />, // Add the new route
      },
      {
        path: "all-user",
        element: <AllUser />, // Add the new route
      },
      {
        path: "userDetails/:userId",
        element: <UserDetails />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLogin />,
  },
]);

export default router;
