import GamesList from "@/components/dashboard/GameList/GameList";
import GameUpload from "@/components/dashboard/GameUpload/GameUpload";

const AddGame = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <GamesList />
    </div>
  );
};

export default AddGame;
//     <GameUpload />
