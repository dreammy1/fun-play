import Button from "@/components/shared/button/Button";
import OfferCard from "@/components/shared/offerCard/OfferCard";
import RouteChange from "@/components/shared/routeChange/RouteChange";
import { useGetPromotionsQuery } from "@/redux/features/allApis/promotionApi/promotionApi";
import { useEffect, useState } from "react";

const Promotion = () => {
  const {
    data: promotions,
    isLoading,
    isError,
    error,
  } = useGetPromotionsQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  useEffect(() => {
    console.log(promotions);
  }, [promotions]);

  const openModal = (promotion) => {
    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPromotion(null);
  };

  const buttons = [
    { textName: "সব" },
    { textName: "খেলাধুলা" },
    { textName: "লাইভ ক্যাসিনো" },
    { textName: "স্লট" },
    { textName: "টেবিল গেম" },
    { textName: "VIP" },
    { textName: "ক্র্যাশ" },
    { textName: "টুর্নামেন্ট" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Mobile slide menu */}
      <RouteChange text="প্রমোশন" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-3 mt-6 p-3 bg-white rounded-xl shadow-lg overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {buttons.map((button) => (
            <Button
              key={button.textName}
              nameText={button.textName}
              className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-medium"
            />
          ))}
        </div>
        <div className="py-10 grid gap-8 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          {isLoading ? (
            <div className="col-span-full text-center text-gray-700 text-lg font-medium animate-pulse">
              Loading promotions...
            </div>
          ) : isError ? (
            <div className="col-span-full text-center text-red-600 text-lg font-medium">
              Error: {error?.message || "Failed to fetch promotions"}
            </div>
          ) : promotions?.data?.length > 0 ? (
            promotions.data.map((offer) => (
              <OfferCard
                key={offer._id}
                cardImage={`${import.meta.env.VITE_BASE_API_URL}/${offer.img}`}
                cardHeading={offer.title}
                cardText={offer.description.replace(/<\/?p>/g, "")}
                cardButton={
                  offer.promotion_bonuses?.[0]?.bonus
                    ? `দাবি করুন (${offer.promotion_bonuses[0].bonus}%)`
                    : "দাবি করুন"
                }
                promotion={offer}
                openModal={openModal}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-700 text-lg font-medium">
              No promotions available.
            </div>
          )}
        </div>
      </div>

      {/* Modal for promotion details */}
      {isModalOpen && selectedPromotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-[90%] sm:max-w-[600px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {selectedPromotion.title_bd}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <img
              src={`${import.meta.env.VITE_BASE_API_URL}/${
                selectedPromotion.img
              }`}
              alt={selectedPromotion.title_bd}
              className="w-full max-w-[600px] mx-auto rounded-lg object-cover mb-4"
            />
            <p className="text-base sm:text-lg text-gray-700 mb-4">
              {selectedPromotion.description_bd.replace(/<\/?p>/g, "")}
            </p>
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                বোনাস বিস্তারিত
              </h3>
              <p className="text-base sm:text-lg">
                <strong>বোনাসের ধরন:</strong>{" "}
                {selectedPromotion.promotion_bonuses?.[0]?.bonus_type ===
                "Percentage"
                  ? "শতাংশ"
                  : "নির্দিষ্ট মূল্য"}
              </p>
              <p className="text-base sm:text-lg">
                <strong>বোনাস:</strong>{" "}
                {selectedPromotion.promotion_bonuses?.[0]?.bonus_type ===
                "Percentage"
                  ? `${selectedPromotion.promotion_bonuses[0].bonus}%`
                  : `${selectedPromotion.promotion_bonuses[0].bonus} টাকা`}
              </p>
              {selectedPromotion.promotion_bonuses?.[0]?.payment_method && (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mt-4">
                    পেমেন্ট মেথড
                  </h3>
                  <p className="text-base sm:text-lg">
                    <strong>মেথড:</strong>{" "}
                    {
                      selectedPromotion.promotion_bonuses[0].payment_method
                        .methodNameBD
                    }
                  </p>
                  <p className="text-base sm:text-lg">
                    <strong>এজেন্ট ওয়ালেট নাম্বার:</strong>{" "}
                    {
                      selectedPromotion.promotion_bonuses[0].payment_method
                        .agentWalletNumber
                    }
                  </p>
                  <p className="text-base sm:text-lg">
                    <strong>নির্দেশনা:</strong>{" "}
                    {selectedPromotion.promotion_bonuses[0].payment_method.instructionBD.replace(
                      /<\/?p>/g,
                      ""
                    )}
                  </p>
                  {selectedPromotion.promotion_bonuses[0].payment_method.userInputs?.map(
                    (input, index) => (
                      <p key={index} className="text-base sm:text-lg">
                        <strong>{input.labelBD}:</strong>{" "}
                        {input.fieldInstructionBD}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotion;
