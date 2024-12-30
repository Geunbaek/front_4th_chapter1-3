import { useState } from "react";
import { ItemList } from "./ItemList";
import { generateItems } from "../../utils";
import { useCallback } from "../../@lib";
import { ComplexForm } from "./ComplexForm";

export const MainSection = () => {
  const [items, setItems] = useState(() => generateItems(1000));

  const addItems = useCallback(() => {
    setItems((prevItems) => [
      ...prevItems,
      ...generateItems(1000, prevItems.length),
    ]);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 md:pr-4">
          <ItemList items={items} onAddItemsClick={addItems} />
        </div>
        <div className="w-full md:w-1/2 md:pl-4">
          <ComplexForm />
        </div>
      </div>
    </div>
  );
};