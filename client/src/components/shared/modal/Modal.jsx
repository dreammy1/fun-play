import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaTimes, FaShoppingCart } from "react-icons/fa";

const Modal = ({ isOpen, onOpenChange, title, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-md sm:max-w-lg md:max-w-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-100 rounded-3xl shadow-2xl border-4 border-purple-200 transform transition-all duration-500 ease-in-out scale-95 hover:scale-100">
        <DialogHeader className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white rounded-t-2xl p-5 sm:p-6 relative">
          <DialogTitle className="text-left text-xl sm:text-2xl md:text-3xl font-extrabold drop-shadow-lg tracking-tight">
            {title || "দুঃখিত স্যার!"}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-white hover:text-yellow-200 transition duration-300 transform hover:scale-110"
            aria-label="Close Modal"
          >
          
          </button>
        </DialogHeader>
        <div className="p-6 sm:p-8 bg-white rounded-b-2xl text-gray-800">
          <p className="text-base sm:text-lg font-semibold mb-6 leading-relaxed">
            {children || (
              <>
                আপনি এই ফিচারটি ব্যবহার করতে পারবেন না। এটি ব্যবহার করতে হলে
                আপনাকে <span className="text-purple-600 font-bold">Premium Plugin</span> ক্রয় করতে হবে।
              </>
            )}
          </p>

          {
            title === "দুক্ষিত স্যার!" &&  <div className="flex justify-center">
            <button
              onClick={() => window.location.href = "https://oraclesoft.org"}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg shadow-md hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <FaShoppingCart className="text-lg" />
              <span className="font-semibold text-base sm:text-lg">এখনই কিনুন</span>
            </button>
          </div>
          }
         
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;