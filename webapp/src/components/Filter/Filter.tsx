import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import SingleSelect from "../MultiSelect/MultiSelect";

const Filter = ({
  selected = "All",
  setSelected
}: {
  selected: string;
  setSelected: (_values: string) => void;
}) => {
  const { auth } = useAuth();

  const centerDropdown = useMemo(() => {
    const centerList = auth.user.centerId ?? [];
    console.log('centerList: ', centerList);

    const allOption = centerList.length > 1 ? [{ value: "All", label: "All" }] : [];

    const mappedCenters = centerList.map(
      ({ centerName, _id }: { centerName: string; _id: string }) => ({
        label: centerName,
        value: _id
      })
    );

    return [...allOption, ...mappedCenters];
  }, [auth.user.centerId]);

  return (
    <>
      <SingleSelect
        options={centerDropdown}
        selectedValue={selected}
        onChange={setSelected}
        placeholder={centerDropdown?.length > 1 ? "All" : centerDropdown[0]?.label}
      />
    </>
  );
};

export default Filter;
