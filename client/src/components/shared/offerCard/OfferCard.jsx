import { useSelector } from "react-redux";
import { useState, useRef } from "react";

const OfferCard = ({
  cardImage,
  cardHeading,
  cardText,
  cardButton,
  promotion,
  openModal,
}) => {
  const { mainColor, backgroundColor } = useSelector(
    (state) => state.themeColor
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef(null);

  const renderCardText = () => {
    return { __html: cardText };
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="max-w-[1100px] md:max-w-[1400px] lg:max-w-[1600px] xl:max-w-[1800px] p-6 sm:p-8 bg-slate-100 rounded-lg space-y-4 mx-auto">
      <img
        src={cardImage}
        alt=""
        className="w-full md:max-w-[800px] lg:max-w-[1000px] rounded-lg object-cover"
      />
      <h2 className="text-lg lg:text-2xl font-semibold">{cardHeading}</h2>

      <div className="relative">
        {/* Content container */}
        <div
          ref={contentRef}
          className={`text-base lg:text-xl transition-all duration-500 overflow-hidden ${
            isExpanded
              ? "max-h-none opacity-100"
              : "max-h-[6rem] lg:max-h-[8rem] opacity-100"
          }`}
          dangerouslySetInnerHTML={renderCardText()}
        />

        {/* Fade overlay when truncated */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-100 to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* Expand/Collapse button - integrated with main button */}
      {!isExpanded ? (
        <button
          onClick={toggleExpand}
          style={{ backgroundColor: "#4DFF00", color: "#000000" }}
          className="p-3 w-full text-white bg-green-600 hover:bg-green-500 rounded-lg transition-all duration-300 font-medium"
        >
          আরও পড়ুন
        </button>
      ) : (
        <button
          onClick={toggleExpand}
          style={{ backgroundColor: "#000000", color: "#4DFF00" }}
          className="p-3 w-full text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-300 font-medium"
        >
          কম দেখান
        </button>
      )}
    </div>
  );
};

export default OfferCard;
