import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaCaretDown,
  FaPlus,
  FaUser,
  FaGift,
  FaTrophy,
  FaUsers,
  FaTicketAlt,
  FaBaseballBall,
  FaDice,
  FaTable,
  FaBook,
  FaFish,
  FaRocket,
  FaGamepad,
  FaLanguage,
  FaQuestionCircle,
  FaComment,
  FaDownload,
  FaSignOutAlt,
} from "react-icons/fa";
import { IoHome, IoMenuOutline } from "react-icons/io5";
import { TbCurrencyTaka } from "react-icons/tb";
import { FiRefreshCw } from "react-icons/fi";
import { useEffect, useState } from "react";
import Modal from "../modal/Modal";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet"; // Shadcn sheet
import MegaMenu from "../megaMenu/MegaMenu";
import { useDispatch, useSelector } from "react-redux";
import { useToasts } from "react-toast-notifications";
import { logout } from "@/redux/slices/authSlice";
import { useGetHomeControlsQuery } from "@/redux/features/allApis/homeControlApi/homeControlApi";
import { useLazyGetUserByIdQuery } from "@/redux/features/allApis/usersApi/usersApi";
import { useGetCategoriesQuery } from "@/redux/features/allApis/categoriesApi/categoriesApi";
import hotIcon from "@/assets/images/hot-icon.png";
import { RiLogoutCircleRFill } from "react-icons/ri";

const data = [
  {
    id: 1,
    icon: <FaGift size={20} />,
    title: "প্রমোশন",
    route: "/promotion",
    badge: "",
  },
  {
    id: 2,
    icon: <FaTrophy size={20} />,
    title: "পুরস্কার",
    route: "/profile/rewards",
    badge: "new",
  },
  {
    id: 3,
    icon: <FaUsers size={20} />,
    title: "রেফারেল প্রোগ্রাম",
    route: "/referral",
    badge: "hot",
  },
  {
    id: 4,
    icon: <FaTicketAlt size={20} />,
    title: "বেটিং পাস",
    route: "/profile/rewards",
    badge: "hot",
  },
  {
    id: 5,
    icon: <FaBaseballBall size={20} />,
    title: "IPL 2025 বেটিং পাস",
    route: "/profile/rewards",
    badge: "hot",
  },
  {
    id: 6,
    icon: <FaUsers size={20} />,
    title: "অ্যাফিলিয়েট",
    route: "/profile/rewards",
    badge: "",
  },
];

const gamesData = [
  {
    id: 1,
    icon: <FaBaseballBall size={20} />,
    title: "স্পোর্টস",
    route: "/cricket",
    badge: "",
  },
  {
    id: 2,
    icon: <FaDice size={20} />,
    title: "ক্যাসিনো",
    route: "/casino",
    badge: "",
  },
  {
    id: 3,
    icon: <FaGamepad size={20} />,
    title: "স্লট গেম",
    route: "/slot",
    badge: "",
  },
  {
    id: 4,
    icon: <FaTable size={20} />,
    title: "টেবিল গেম",
    route: "/table-games",
    badge: "",
  },
  {
    id: 5,
    icon: <FaBook size={20} />,
    title: "খেলার বই",
    route: "/sports-book",
    badge: "",
  },
  {
    id: 6,
    icon: <FaFish size={20} />,
    title: "মাছ ধরা",
    route: "/fishing",
    badge: "",
  },
  {
    id: 7,
    icon: <FaRocket size={20} />,
    title: "ক্র্যাশ",
    route: "/crash",
    badge: "new",
  },
  {
    id: 8,
    icon: <FaGamepad size={20} />,
    title: "দ্রুতগতির গেমস",
    route: "/cricket",
    badge: "",
  },
];

const Navbar = () => {
  const { data: homeControls } = useGetHomeControlsQuery();
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useGetCategoriesQuery();
  const { user, token } = useSelector((state) => state.auth);
  const {
    mainBackgroundTextColor,
    mainBackgroundColor,
    mobileSidebarMenuBackgroundColor,
    mobileSidebarMenuTextColor,
    mobileSidebarMenuIconColor,
  } = useSelector((state) => state.themeColor);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToasts();

  const [mainColor, setMainColor] = useState(mainBackgroundTextColor);
  const [backgroundColor, setBackgroundColor] = useState(mainBackgroundColor);

  // Fallback colors
  const navBackgroundColor = backgroundColor || "#333333";
  const primaryColor = mainColor || "#FFCD03";

  // Utility to darken a hex color for hover effect
  const _darkenColor = (hex, amount) => {
    let color = hex.replace("#", "");
    const num = parseInt(color, 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  const darkenColor = (hex, amount) => _darkenColor(hex, amount);
  const primaryHoverColor = mainColor ? darkenColor(mainColor, 0.1) : "#e5be22";

  // Dynamic mega menu data
  const getMegaMenuData = (category) => {
    return categories
      .filter((cat) => cat.category === category)
      .map((cat) => ({
        route:
          category === "sb"
            ? "/sports-book"
            : category === "table"
            ? "/table-games"
            : `/${category}`,
        image: `${import.meta.env.VITE_BASE_API_URL}${cat?.image}`,
        title: cat.title,
      }));
  };

  const megaMenuData = {
    cricket: getMegaMenuData("cricket"),
    casino: getMegaMenuData("casino"),
    slot: getMegaMenuData("slot"),
    table: getMegaMenuData("table"),
    sports_book: getMegaMenuData("sb"),
    fishing: getMegaMenuData("fishing"),
    crash: getMegaMenuData("crash"),
  };

  const modalData = [
    {
      id: 1,
      currency: "BDT",
      currencySymbol: "৳",
      flagSrc: "https://www.babu88.app/static/image/country/BDT.svg",
      languages: ["ENGLISH", "BENGALI"],
    },
    {
      id: 2,
      currency: "INR",
      currencySymbol: "₹",
      flagSrc: "https://www.babu88.app/static/image/country/INR.svg",
      languages: ["ENGLISH", "HINDI"],
    },
    {
      id: 3,
      currency: "NPR",
      currencySymbol: "₨",
      flagSrc: "https://www.babu88.app/static/image/country/NPR.svg",
      languages: ["ENGLISH", "NEPALESE"],
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCasinoHovered, setIsCasinoHovered] = useState(false);
  const [isSlotHovered, setIsSlotHovered] = useState(false);
  const [isTableHovered, setIsTableHovered] = useState(false);
  const [isSportHovered, setIsSportHovered] = useState(false);
  const [isFishingHovered, setIsFishingHovered] = useState(false);
  const [isCrashHovered, setIsCrashHovered] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    addToast("Logout successful", {
      appearance: "success",
      autoDismiss: true,
    });
    navigate("/");
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const logo = homeControls?.find(
    (control) => control.category === "logo" && control.isSelected
  );

  const [triggerGetUserById, { data: userData, isLoading, isError }] =
    useLazyGetUserByIdQuery();

  const getUserDataAgain = (props) => {
    if (props) {
      triggerGetUserById(props);
    }
  };

  useEffect(() => {
    if (user) {
      triggerGetUserById(user._id);
    }
  }, [user, triggerGetUserById]);

  return (
    <div className="z-20">
      <style>
        {`
          .nav-link:hover {
            color: ${mainColor};
            background-color: #424242;
            border-bottom: 4px solid ${mainColor};
          }
          .login-button:hover {
            background-color: ${darkenColor(mainColor, 0.1)};
          }
          .signup-button:hover {
            background-color: #2f9bff;
          }
          .language-button:hover {
            background-color: #c2c2c2;
          }
          .profile-button:hover,
          .notification-button:hover,
          .logout-button:hover {
            background-color: ${darkenColor(mainColor, 0.1)};
          }
          .deposit-button:hover {
            background-color: ${mainColor};
          }
          .load-button:hover {
            background-color: #2563EB;
          }
        `}
      </style>
      {/* Start top navbar */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Mobile menu icon */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild style={{ border: "none" }}>
                <button
                  className="ml-auto border-none"
                  style={{ border: "none" }}
                >
                  <IoMenuOutline size={30} style={{ border: "none" }} />
                </button>
              </SheetTrigger>
              <SheetContent
                className="w-64 p-2"
                side="left"
                style={{ backgroundColor: mobileSidebarMenuBackgroundColor }}
              >
                <SheetClose asChild className="border-b-2 pb-2">
                  <div className="w-40">
                    <Link to={"/"} onClick={() => console.log("Logo clicked")}>
                      <img
                        src={`${import.meta.env.VITE_BASE_API_URL}${
                          logo?.image
                        }`}
                        alt="Logo"
                      />
                    </Link>
                  </div>
                </SheetClose>
                <ul className="space-y-6 overflow-y-auto h-[92%]">
                  {data?.map((item) => (
                    <SheetClose key={item.id} asChild>
                      <Link to={item.route}>
                        <li className="flex items-center justify-start gap-3 mt-4 text-xs font-medium px-3 py-2 hover:bg-slate-200 rounded-lg">
                          <div style={{ color: mobileSidebarMenuIconColor }}>
                            {item.icon}
                          </div>
                          <p style={{ color: mobileSidebarMenuTextColor }}>
                            {item.title}
                          </p>
                          {item?.badge &&
                            (item?.badge === "hot" ? (
                              <div className="w-8 animate-pulse">
                                <img
                                  className="w-full"
                                  src={hotIcon}
                                  alt="Hot"
                                />
                              </div>
                            ) : (
                              <button className="animate-pulse rounded-full w-8 bg-[#04B22B] text-white">
                                new
                              </button>
                            ))}
                        </li>
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="border-b-2 pb-2">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: mobileSidebarMenuTextColor }}
                    >
                      Games
                    </p>
                  </div>
                  {gamesData?.map((item) => (
                    <SheetClose key={item.id} asChild>
                      <Link to={item.route}>
                        <li className="flex gap-4 mt-1 text-sm font-medium px-3 py-2 hover:bg-slate-200 rounded-lg">
                          <div style={{ color: mobileSidebarMenuIconColor }}>
                            {item.icon}
                          </div>
                          <p style={{ color: mobileSidebarMenuTextColor }}>
                            {item.title}
                          </p>
                          {item?.badge && (
                            <button className="animate-pulse rounded-full w-10 py-1 bg-[#04B22B] text-white">
                              new
                            </button>
                          )}
                        </li>
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="border-b-2 pb-2">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: mobileSidebarMenuTextColor }}
                    >
                      Others
                    </p>
                  </div>
                  <SheetClose asChild>
                    <Link to={"/"}>
                      <li
                        onClick={handleModalOpen}
                        className="flex gap-4 mt-1 text-sm font-medium px-3 py-2 hover:bg-slate-200 rounded-lg"
                      >
                        <FaLanguage
                          size={20}
                          style={{ color: mobileSidebarMenuIconColor }}
                        />
                        <p style={{ color: mobileSidebarMenuTextColor }}>
                          ভাষা
                        </p>
                      </li>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to={"/faq"}>
                      <li className="flex gap-4 mt-1 text-sm font-medium px-3 py-2 hover:bg-slate-200 rounded-lg">
                        <FaQuestionCircle
                          size={20}
                          style={{ color: mobileSidebarMenuIconColor }}
                        />
                        <p style={{ color: mobileSidebarMenuTextColor }}>
                          প্রায়শই জিজ্ঞাসিত প্রশ্নাবলী
                        </p>
                      </li>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to={"/faq"}>
                      <li className="flex gap-4 mt-1 text-sm font-medium px-3 py-2 hover:bg-slate-200 rounded-lg">
                        <FaComment
                          size={20}
                          style={{ color: mobileSidebarMenuIconColor }}
                        />
                        <p style={{ color: mobileSidebarMenuTextColor }}>
                          সরাসরি কথোপকথন
                        </p>
                      </li>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to={"./babu88.apk"} target={"_blank"} download>
                      <li className="flex gap-4 mt-1 text-sm font-medium px-3 py-2 hover:bg-slate-200 rounded-lg">
                        <FaDownload
                          size={20}
                          style={{ color: mobileSidebarMenuIconColor }}
                        />
                        <p style={{ color: mobileSidebarMenuTextColor }}>
                          ডাউনলোড করুন
                        </p>
                      </li>
                    </Link>
                  </SheetClose>
                  {user && (
                    <SheetClose asChild>
                      <li
                        onClick={handleLogout}
                        className="flex gap-4 mt-10 text-sm font-medium px-3 py-2 hover:bg-slate-200 rounded-lg"
                      >
                        <FaSignOutAlt
                          size={20}
                          style={{ color: mobileSidebarMenuIconColor }}
                        />
                        <p style={{ color: mobileSidebarMenuTextColor }}>
                          প্রস্থান
                        </p>
                      </li>
                    </SheetClose>
                  )}
                </ul>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <div className="w-52 sm:w-56 md:w-72">
            <Link to={"/"}>
              <img
                src={`${import.meta.env.VITE_BASE_API_URL}${logo?.image}`}
                alt="Logo"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Dashboard */}
            {token && user ? (
              <div className="md:flex justify-center items-center gap-3 hidden">
                <div className="flex justify-center items-center gap-2 lg:gap-3">
                  <p className="text-lg font-bold">{user?.username}</p>
                  <Link to={"/profile"}>
                    <div
                      className="flex justify-center items-center p-3 text-base lg:text-xl profile-button rounded-full"
                      style={{
                        backgroundColor: backgroundColor,
                        color: mainColor,
                      }}
                    >
                      <FaUser />
                    </div>
                  </Link>

                  <div>
                    <button
                      onClick={handleLogout}
                      className="flex justify-center items-center p-2.5 text-xl lg:text-2xl logout-button rounded-full"
                      style={{
                        backgroundColor: backgroundColor,
                        color: mainColor,
                      }}
                    >
                      <RiLogoutCircleRFill />
                    </button>
                  </div>
                  <div className="w-1 h-10 border-r border-gray-400"></div>
                </div>
                <div className="flex gap-2 items-center pl-4 rounded-full bg-gray-200">
                  <div className="flex items-center text-xl lg:text-2xl">
                    <TbCurrencyTaka />
                    {isLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      <p>
                        {(
                          userData?.balance ||
                          user?.balance ||
                          0
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => user && getUserDataAgain(user._id)}
                    className="flex justify-center items-center p-2.5 text-sm font-semibold text-white load-button rounded-full"
                    style={{ backgroundColor: "#3B82F6" }}
                    disabled={isLoading}
                    aria-label={
                      isLoading ? "Loading balance" : "Reload balance"
                    }
                  >
                    {isLoading ? (
                      <FiRefreshCw className="animate-spin h-5 w-5 text-white" />
                    ) : (
                      <FiRefreshCw className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <Link to={"/profile/deposit"}>
                    <div
                      className="flex justify-center items-center p-2.5 text-xl lg:text-2xl text-white deposit-button rounded-full"
                      style={{
                        backgroundColor: backgroundColor,
                        color: mainColor,
                      }}
                    >
                      <FaPlus />
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="md:flex items-center gap-4 hidden">
                <Link to={"/login"}>
                  <li
                    className="text-sm font-semibold px-3 py-2 rounded-lg login-button"
                    style={{
                      backgroundColor: primaryColor,
                      color: backgroundColor,
                    }}
                  >
                    প্রবেশ করুন
                  </li>
                </Link>
                <Link to={"/register"}>
                  <li
                    className="text-sm font-semibold px-3 py-2 rounded-lg text-white signup-button"
                    style={{
                      backgroundColor: backgroundColor,
                      color: mainColor,
                    }}
                  >
                    এখনি যোগদিন
                  </li>
                </Link>
              </ul>
            )}

            {/* Language */}
            <ul>
              <li
                onClick={handleModalOpen}
                className="cursor-pointer text-sm lg:text-base font-semibold px-2 py-1 rounded-lg language-button"
                style={{ backgroundColor: "#d6d6d6" }}
              >
                <div className="flex items-center">
                  <div className="w-6 md:w-7">
                    <img
                      src="https://png.pngtree.com/png-vector/20220606/ourmid/pngtree-bangladesh-flag-icon-in-modern-neomorphism-style-png-image_4872074.png"
                      alt="BD flag"
                    />
                  </div>
                  <FaCaretDown />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom navbar */}
      <div
        className="md:flex hidden relative"
        style={{
          backgroundColor: navBackgroundColor,
          color: mainBackgroundTextColor,
        }}
      >
        <div className="container mx-auto px-4">
          <ul className="flex whitespace-nowrap overflow-x-auto">
            {/* Single menu */}
            <NavLink
              to={"/"}
              className="text-sm font-semibold flex items-center gap-1 justify-center py-3 text-white nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
            >
              <p className="py-1 px-5 border-r-[1px]">
                <IoHome size={20} style={{ color: mainBackgroundTextColor }} />
              </p>
            </NavLink>

            {/* Single cricket menu */}
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <NavLink
                to={"/cricket"}
                className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
                style={{ color: mainBackgroundTextColor }}
              >
                <p>স্পোর্টস</p>
              </NavLink>
              <div
                style={{ backgroundColor: backgroundColor }}
                className={`absolute left-0 top-full w-full z-20 text-black p-5 transform transition-transform duration-300 ease-in-out ${
                  isHovered
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-10 opacity-0 pointer-events-none"
                }`}
              >
                <MegaMenu items={megaMenuData.cricket} />
              </div>
            </div>

            {/* Single casino menu */}
            <div
              onMouseEnter={() => setIsCasinoHovered(true)}
              onMouseLeave={() => setIsCasinoHovered(false)}
            >
              <NavLink
                to={"/casino"}
                className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
                style={{ color: mainBackgroundTextColor }}
              >
                <p>ক্যাসিনো</p>
              </NavLink>
              <div
                style={{ backgroundColor: backgroundColor }}
                className={`absolute left-0 top-full w-full z-20 text-black p-5 transform transition-transform duration-300 ease-in-out ${
                  isCasinoHovered
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-10 opacity-0 pointer-events-none"
                }`}
              >
                <MegaMenu items={megaMenuData.casino} />
              </div>
            </div>

            {/* Single slot menu */}
            <div
              onMouseEnter={() => setIsSlotHovered(true)}
              onMouseLeave={() => setIsSlotHovered(false)}
            >
              <NavLink
                to={"/slot"}
                className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
                style={{ color: mainBackgroundTextColor }}
              >
                <p>স্লট গেম</p>
              </NavLink>
              <div
                style={{ backgroundColor: backgroundColor }}
                className={`absolute left-0 top-full w-full z-20 text-black p-5 transform transition-transform duration-300 ease-in-out ${
                  isSlotHovered
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-10 opacity-0 pointer-events-none"
                }`}
              >
                <MegaMenu items={megaMenuData.slot} />
              </div>
            </div>

            {/* Single table game menu */}
            <div
              onMouseEnter={() => setIsTableHovered(true)}
              onMouseLeave={() => setIsTableHovered(false)}
            >
              <NavLink
                to={"/table-games"}
                className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
                style={{ color: mainBackgroundTextColor }}
              >
                <p>টেবিল গেম</p>
              </NavLink>
              <div
                style={{ backgroundColor: backgroundColor }}
                className={`absolute left-0 top-full w-full z-20 text-black p-5 transform transition-transform duration-300 ease-in-out ${
                  isTableHovered
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-10 opacity-0 pointer-events-none"
                }`}
              >
                <MegaMenu items={megaMenuData.table} />
              </div>
            </div>

            {/* Single sports-book menu */}
            <div
              onMouseEnter={() => setIsSportHovered(true)}
              onMouseLeave={() => setIsSportHovered(false)}
            >
              <NavLink
                to={"/sports-book"}
                className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
                style={{ color: mainBackgroundTextColor }}
              >
                <p>খেলার বই</p>
              </NavLink>
              <div
                style={{ backgroundColor: backgroundColor }}
                className={`absolute left-0 top-full w-full z-20 text-black p-5 transform transition-transform duration-300 ease-in-out ${
                  isSportHovered
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-10 opacity-0 pointer-events-none"
                }`}
              >
                <MegaMenu items={megaMenuData.sports_book} />
              </div>
            </div>

            {/* Single fishing menu */}
            <div
              onMouseEnter={() => setIsFishingHovered(true)}
              onMouseLeave={() => setIsFishingHovered(false)}
            >
              <NavLink
                to={"/fishing"}
                className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
                style={{ color: mainBackgroundTextColor }}
              >
                <p>মাছ ধরা</p>
              </NavLink>
              <div
                style={{ backgroundColor: backgroundColor }}
                className={`absolute left-0 top-full w-full z-20 text-black p-5 transform transition-transform duration-300 ease-in-out ${
                  isFishingHovered
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-10 opacity-0 pointer-events-none"
                }`}
              >
                <MegaMenu items={megaMenuData.fishing} />
              </div>
            </div>

            {/* Single Crash menu */}
            <div
              onMouseEnter={() => setIsCrashHovered(true)}
              onMouseLeave={() => setIsCrashHovered(false)}
            >
              <NavLink
                to={"/crash"}
                className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
                style={{ color: mainBackgroundTextColor }}
              >
                <p>ক্র্যাশ</p>
              </NavLink>
              <div
                style={{ backgroundColor: backgroundColor }}
                className={`absolute left-0 top-full w-full z-20 text-black p-5 transform transition-transform duration-300 ease-in-out ${
                  isCrashHovered
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-10 opacity-0 pointer-events-none"
                }`}
              >
                <MegaMenu items={megaMenuData.crash} />
              </div>
            </div>

            {/* Single promotion menu */}
            <NavLink
              to={"/promotion"}
              className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
              style={{ color: mainBackgroundTextColor }}
            >
              <p>প্রমোশন</p>
            </NavLink>

            {/* Single betting-pass menu */}
            <NavLink
              to={"/betting-pass"}
              className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
              style={{ color: mainBackgroundTextColor }}
            >
              <p>বেটিং পাস</p>
            </NavLink>

            {/* Single referral menu */}
            <NavLink
              to={"/referral"}
              className="text-sm font-semibold flex items-center gap-1 justify-center px-5 py-4 nav-link border-b-[4px] border-b-transparent transition-colors duration-200 ease-linear"
              style={{ color: mainBackgroundTextColor }}
            >
              <p>সুপারিশ</p>
            </NavLink>
          </ul>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onOpenChange={handleModalClose}
        title={"Currency and Language"}
      >
        <div className="space-y-4">
          {modalData.map((item) => (
            <div key={item.id} className="flex gap-2 md:gap-6">
              <div className="flex items-center gap-1 md:gap-2 w-full">
                <img className="w-10" src={item.flagSrc} alt={item.currency} />
                <p className="text-sm md:text-base font-semibold text-gray-400">
                  {item.currencySymbol} {item.currency}
                </p>
              </div>
              {item.languages.map((language) => (
                <button
                  key={language}
                  className="w-full px-3 py-2 text-sm md:text-base font-semibold text-gray-500 hover:text-yellow-300 hover:bg-red-50 border border-gray-300 rounded"
                >
                  {language}
                </button>
              ))}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Navbar;
