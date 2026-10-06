import { useEffect, useState } from "react";
import {
  FaChevronRight,
  FaHistory,
  FaCalendarAlt,
  FaGift,
  FaBullhorn,
  FaCog,
  FaRedo,
  FaHome,
  FaUsers,
  FaEnvelope,
} from "react-icons/fa";
import { motion, AnimatePresence, color } from "framer-motion";
import { useSelector } from "react-redux";
import { useLazyGetUserByIdQuery } from "@/redux/features/allApis/usersApi/usersApi";
import { TbCurrencyTaka } from "react-icons/tb";
import { useToasts } from "react-toast-notifications";
import { Link, useNavigate } from "react-router-dom";

export default function ProfileAccount() {
  const navigate = useNavigate();
  const [openAccordion, setOpenAccordion] = useState(null);
  const { addToast } = useToasts();
  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const { mainColor, backgroundColor } = useSelector(
    (state) => state.themeColor
  );

  const { user } = useSelector((state) => state.auth);

  const [triggerGetUserById, { data: userData, isLoading, isError }] =
    useLazyGetUserByIdQuery();

  const getUserDataAgain = (props) => {
    if (props) {
      triggerGetUserById(props);
      if (!isError) {
        addToast("Amount refreshed successfully", { appearance: "success" });
      } else {
        addToast("Failed to refresh user data", { appearance: "error" });
      }

      triggerGetUserById(props);
    }
  };

  useEffect(() => {
    if (user) {
      triggerGetUserById(user._id);
    }
  }, [user, triggerGetUserById]);

  const accordionItems = [
    {
      icon: <FaHistory />,
      label: "ইতিহাস",
      subItems: [
        { label: "বাজি ইতিহাস", link: "/profile/BettingHistory" },
        { label: "টার্নওভার ইতিহাস" },
        { label: "ওয়ালেট ইতিহাস", link: "/profile/history" },
      ],
    },
    {
      icon: <FaCalendarAlt />,
      label: "বিশেষ",
      subItems: [
        { label: "রেফারেল প্রোগ্রাম", link: "/referral" },
        { label: "বেটিং পাস", link: "/profile/BettingHistory" },
        { label: "অ্যাফিলিয়েট", link: "" },
      ],
    },
    {
      icon: <FaGift />,
      label: "পুরস্কার",
      subItems: [
        { label: "দাবি ভাউচার", link: "" },
        { label: "ভাগ্য ঘোরা", link: "" },
        { label: "দৈনিক চেক ইন", link: "" },
        { label: "রিওয়ার্ড স্টোর", link: "" },
      ],
    },
    {
      icon: <FaBullhorn />,
      label: "সামাজিক যোগাযোগ মাধ্যম",
      subItems: [
        { label: "Facebook", link: "https://www.facebook.com/" },
        { label: "Telegram", link: "https://t.me/" },
        { label: "Twitter", link: "https://twitter.com/" },
        { label: "YouTube", link: "https://www.youtube.com/" },
      ],
    },
    {
      icon: <FaCog />,
      label: "ব্যাংক বিবরণ",
      subItems: [
        { label: "প্রোফাইল", link: "/profile" },
        { label: "ব্যাংক বিবরণ", link: "/profile" },
        { label: "পাসওয়ার্ড পরিবর্তন করুন", link: "/profile" },
      ],
    },
  ];

  return (
    <div className="max-w-md mx-auto p-1 font-solaimanlipi">
      {/* Top user and icons row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm font-semibold">{user.username}</div>
          <span className="flex items-center">
            ট {(userData?.balance || user?.balance || 0).toLocaleString()}
            <motion.div
            // animate={isLoading ? { rotate: 0 } : { rotate: 360 }}
            //  transition={{ duration: 0.5, ease: "easeOut", repeat: Infinity }}
            >
              <FaRedo
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => {
                  user && getUserDataAgain(user._id);
                }}
              />
            </motion.div>
          </span>
        </div>

        <div className="flex space-x-4">
          <IconWithLabel
            icon={<FaHome className="w-5 h-5 " />}
            label="বেটিং পাশ"
            navigate={navigate}
            link="/"
            bg={backgroundColor}
            color={color}
          />
          <IconWithLabel
            icon={<FaGift className="w-5 h-5" />}
            label="পুরস্কার"
            navigate={navigate}
            link="/promotion"
            bg={backgroundColor}
            color={color}
          />
          <IconWithLabel
            icon={<FaUsers className="w-5 h-5" />}
            label="রেফার"
            navigate={navigate}
            link="/referral"
            bg={backgroundColor}
            color={color}
          />
          <IconWithLabel
            icon={<TbCurrencyTaka className="w-5 h-5" />}
            label="উত্তোলন"
            navigate={navigate}
            link="/profile/withdrawal"
            bg={backgroundColor}
            color={color}
          />
        </div>
      </div>

      {/* Yellow member card */}
      <div
        className="bg-yellow-400 rounded-lg p-4 mb-6 shadow-md shadow-yellow-500/50"
        style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
      >
        <div className="flex items-center mb-3">
          <img
            src="https://storage.googleapis.com/a1aa/image/52b2e8a5-d56d-4006-0a83-df4fd0003ea0.jpg"
            alt="Hexagonal gold badge with a star and stripes"
            className="w-12 h-12 rounded"
            width={48}
            height={48}
          />
          <div className="ml-4 flex-1">
            <div className="font-extrabold text-black text-sm uppercase">
              MEMBER
            </div>
            <div
              className="w-full h-px bg-white my-2"
              style={{ height: "3px" }}
            />
            <div className="flex items-center text-xs font-semibold text-black mt-1">
              <span className="flex-1">LV 1</span>
              <span className="flex-1 text-center">0/60000</span>
              <span className="flex-1 text-right">LV 2</span>
            </div>
          </div>
        </div>
        <div
          className="w-full h-px bg-gray-200 my-2"
          style={{ height: "1px" }}
        />
        <motion.div
          className="text-xs font-semibold mt-1 cursor-pointer flex justify-between items-center text-black"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center">
            VIP মেম্বারশিপের বিবরণ দেখুন
          </span>
          <FaChevronRight />
        </motion.div>
      </div>

      {/* Accordion menu */}
      <div className="space-y-4">
        {accordionItems.map((item, index) => (
          <div key={index}>
            <motion.div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleAccordion(index)}
              whileHover={{ backgroundColor: "#f5f5f5" }}
              transition={{ duration: 0.2 }}
            >
              <AccordionItem icon={item.icon} label={item.label} />
              <motion.div
                animate={{ rotate: openAccordion === index ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <FaChevronRight />
              </motion.div>
            </motion.div>
            <AnimatePresence>
              {openAccordion === index && (
                <motion.ul
                  className="  space-y-1 "
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {item.subItems.map((subItem, subIndex) => (
                    <motion.li
                      key={subIndex}
                      className=" p-1 my-3 text-sm text-gray-800 flex items-center justify-between cursor-pointer"
                      whileHover={{ x: 5, color: "#1f2937" }}
                      transition={{ duration: 0.2 }}
                      onClick={() => navigate(subItem.link)}
                    >
                      {subItem.label}
                      <FaChevronRight className="ml-auto" />
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconWithLabel({ icon, label, link, navigate }) {
  return (
    <motion.div
      className="flex flex-col items-center text-xs "
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        onClick={() => navigate(link)}
        className=" text-white bg-gray-800 rounded-lg p-3 mb-1 flex justify-center items-center"
      >
        {icon}
      </div>
      <span>{label}</span>
    </motion.div>
  );
}

function AccordionItem({ icon, label }) {
  return (
    <div className="flex items-center justify-between w-full text-black text-sm font-semibold">
      <div className="flex items-center space-x-2">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}
