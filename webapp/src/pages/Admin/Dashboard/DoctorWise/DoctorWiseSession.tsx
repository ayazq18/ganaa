import { Button, DateTime, Modal } from "@/components";
import calender from "@/assets/images/calender.svg";
import { IoIosArrowDown } from "react-icons/io";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { getDoctorSession } from "@/apis";
import { IData, INote, IPatient, IDoctor } from "./type";
import { ISelectOption } from "@/components/Select/types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatDate, formatId } from "@/utils/formater";
import messageIcon from "@/assets/images/messageIcon.svg";
import toast from "react-hot-toast";
import { TableShimmer } from "@/components/Shimmer/Shimmer";
import { useAuth } from "@/providers/AuthProvider";
import Filter from "@/components/Filter/Filter";
interface IState {
  loading: boolean;
  center: ISelectOption;
  displayModal: boolean;
  patientData: IPatient;
  doctorData: IDoctor;
  sort: boolean;
}

const TherapistWiseSession = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("All");
  const { auth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateArray, setDateArray] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection"
    }
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectDate = (ranges: any) => {
    // const { startDate, endDate } = ranges.selection;
    setDateRange([ranges.selection]);
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // month is 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const updateQueryParams = (startDate: Date, endDate: Date) => {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    searchParams.set("startDate", formatLocalDate(startOfDay));
    searchParams.set("endDate", formatLocalDate(endOfDay));

    setSearchParams(searchParams);
  };

  const handleClick = (_e?: SyntheticEvent, _bool?: boolean, cancel?: boolean) => {
    const { startDate, endDate } = dateRange[0];
    if (cancel) {
      searchParams.delete("startDate");
      searchParams.delete("endDate");
      setSearchParams(searchParams);
      setDateRange([
        {
          startDate: new Date(),
          endDate: new Date(),
          key: "selection"
        }
      ]);
    } else {
      if (startDate && endDate) {
        const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 31) {
          toast.error("Date range cannot exceed 31 days!");
          return;
        }
        updateQueryParams(startDate, endDate);
      }
    }
  };

  const [state, setState] = useState<IState>({
    loading: false,
    center: { label: "Select", value: "" },
    displayModal: false,
    patientData: {
      _id: "",
      firstName: "",
      lastName: "",
      uhid: "",
      patientPicUrl: "",
      gender: ""
    },
    doctorData: {
      _id: "",
      firstName: "",
      lastName: "",
      centerId: { centerName: "" }
    },
    sort: false
  });

  const [modalNote, setModalNote] = useState<INote[] | []>([]);

  const [data, setData] = useState<IData>();

  const fetchSessionData = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    let centers;

    if (selected === "All" || !selected) {
      centers = auth.user.centerId.map((data) => data._id);
      if (centers.length <= 0) navigate("/");
    } else {
      centers = [selected];
    }

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startDate = searchParams.get("startDate") || thirtyDaysAgo.toISOString();
    const endDate = searchParams.get("endDate") || today.toISOString();
    try {
      const response = await getDoctorSession({
        startDate: startDate || thirtyDaysAgo.toISOString(),
        endDate: endDate || today.toISOString(),
        centerId: centers.join(",")
      });
      if (response.data.status === "success") {
        setData(response.data.data);
        const dates: string[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= new Date(endDate)) {
          const formattedDate = currentDate.toISOString().split("T")[0];
          dates.push(formattedDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        setDateArray(dates);
      } else {
        console.error("Failed to fetch Session data");
      }
    } catch (error) {
      console.error("Error fetching Session data:", error);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [searchParams, selected]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-[#F4F2F0]  min-h-[calc(100vh-64px)] ">
      <div className="w-[1246px] mx-auto">
        <div className="flex justify-between py-5 items-end">
          <div className="flex flex-col">
            <p className="text-[22px] font-bold">Doctor Wise Session</p>
          </div>
          <div className="flex gap-4 items-center">
            <DateTime
              maxDate={new Date()}
              ranges={dateRange}
              onChange={handleSelectDate}
              onClick={handleClick}
            >
              <Button
                variant="outlined"
                size="base"
                className="flex bg-white text-xs py-3!  rounded-lg text-[#505050]"
              >
                <img src={calender} alt="calender" />
                <IoIosArrowDown />
                {searchParams.get("startDate")
                  ? `${formatDate(searchParams.get("startDate"))} to ${formatDate(
                      searchParams.get("endDate")
                    )}`
                  : `${formatDate(
                      new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
                    )} to ${formatDate(new Date().toISOString())}`}
              </Button>
            </DateTime>
            {/* <DateRange>
              <Button
                variant="outlined"
                size="base"
                className="flex bg-white text-xs py-2  rounded-lg text-[#505050]"
              >
                <img src={calender} alt="calender" />
                Date Range
                <IoIosArrowDown />
              </Button>
            </DateRange> */}
            <Filter selected={selected} setSelected={setSelected} />
          </div>
        </div>

        {state.loading && (
          <div className="container gap-6 flex-col  flex items-start w-full p-4">
            <div className="flex justify-between items-end w-full"></div>
            <div className="font-semibold text-xs w-full min-h-screen text-nowrap whitespace-nowrap  overflow-x-auto scrollbar-hidden">
              <div className="w-full text-sm text-left ">
                <TableShimmer rows={10} columns={10} />
              </div>
            </div>
          </div>
        )}
        {!state.loading && (
          <div className="bg-white p-5 max-h-[600px] overflow-auto  rounded-2xl">
            <div
              className="mx-auto overflow-x-auto rounded-md max-h-[70vh] "
              ref={scrollContainerRef}
            >
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-[#CCB69E] border-b border-[#c7bfa7]">
                    <th className="w-[120px] sticky left-0 text-nowrap  bg-[#CCB69E] px-3 py-4 text-left text-xs font-semibold text-black">
                      <div className="flex w-[176px] items-center gap-2">
                        <div className="font-semibold">Patient Name</div>
                        <div
                          className={` cursor-pointer ${state.sort ? " rotate-180 " : ""} `}
                          onClick={() => setState((prev) => ({ ...prev, sort: !prev.sort }))}
                        >
                          <IoIosArrowDown />
                        </div>
                      </div>
                    </th>

                    <th className=" sticky left-[200px] text-nowrap pr-10 bg-[#CCB69E]  py-2 text-center text-xs font-semibold text-black">
                      <div className="w-[100px] flex items-center gap-2 mx-auto font-semibold">
                        Center Name
                        {/* <div
                          className={` cursor-pointer ${state.sort ? " rotate-180 " : ""} `}
                          onClick={() => setState((prev) => ({ ...prev, sort: !prev.sort }))}
                        >
                          <IoIosArrowDown />
                        </div> */}
                      </div>
                    </th>
                    <th className=" sticky left-[340px] pr-16 bg-[#CCB69E] text-nowrap px-3 py-2 text-center text-xs font-semibold text-black">
                      <div className="w-[50px] flex items-center gap-2 font-semibold ">
                        Doctor Assigned
                        {/* <div
                          className={` cursor-pointer ${state.sort ? " rotate-180 " : ""} `}
                          onClick={() => setState((prev) => ({ ...prev, sort: !prev.sort }))}
                        >
                          <IoIosArrowDown />
                        </div> */}
                      </div>
                    </th>
                    {/* <th
                      onClick={handleScroll}
                      className="sticky left-[539px] px-2 bg-[#A2876A] z-10"
                    >
                      <IoIosArrowDown className="rotate-90" />
                    </th> */}
                    {dateArray.length > 0 &&
                      dateArray?.map((date, id) => {
                        return (
                          <th
                            key={id}
                            className="bg-[#CCB69E] text-nowrap  px-3 py-2 text-center text-xs font-semibold text-black"
                          >
                            <div className="w-44 mx-auto">{formatDate(date)}</div>
                          </th>
                        );
                      })}
                  </tr>
                </thead>

                <tbody>
                  {data?.notes.length === 0 && (
                    <tr>
                      <td
                        colSpan={data?.notes?.length + 3}
                        className="text-center fixed left-2/5  py-10 text-gray-500"
                      >
                        No Data exist for the selected date range and center.
                      </td>
                    </tr>
                  )}

                  {(state.sort
                    ? data?.patients?.slice().sort((a, b) => a.firstName.localeCompare(b.firstName))
                    : data?.patients?.slice().sort((a, b) => b.firstName.localeCompare(a.firstName))
                  )?.map((patient) => {
                    // Group notes by therapistId for this patient
                    const notesByDoctor = data?.notes
                      ?.filter((note) => note.patientId === patient._id)
                      ?.reduce<Record<string, INote[]>>((acc, note) => {
                        const therapistId = note.doctorId?._id || "unknown";
                        if (!acc[therapistId]) acc[therapistId] = [];
                        acc[therapistId].push(note);
                        return acc;
                      }, {});

                    return Object.entries(notesByDoctor || {}).map(([therapistId, notes]) => {
                      // Group notes by date string "yyyy-mm-dd"
                      const notesByDate = notes.reduce<Record<string, INote[]>>((acc, note) => {
                        const date = note.noteDateTime.slice(0, 10);
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(note);
                        return acc;
                      }, {});

                      return (
                        <tr
                          key={`${patient._id}-${therapistId}`}
                          className="border-b border-[#d9d4c9] font-semibold"
                        >
                          {/* Patient info */}
                          <td className="sticky text-nowrap left-0 z-10 bg-white px-3 py-2 text-xs  text-black">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex  rounded-full  w-10 h-10 bg-[#C1D1A8] border overflow-hidden items-center justify-center
                                  ${
                                    patient?.gender == "Male"
                                      ? "border-[#00685F]"
                                      : patient?.gender == "Female"
                                      ? "border-[#F14E9A]"
                                      : "border-gray-500"
                                  }
                                `}
                              >
                                {patient?.patientPicUrl ? (
                                  <img
                                    src={patient?.patientPicUrl}
                                    alt="profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="uppercase text-sm font-medium">
                                    {patient?.firstName?.trim().slice(0, 1)}
                                    {patient?.lastName?.trim().slice(0, 1)}
                                  </div>
                                )}
                              </div>
                              <div className="w-[120px]">
                                {patient.firstName} {patient.lastName}
                                <br />
                                {formatId(patient?.uhid)}
                              </div>
                            </div>
                          </td>

                          {/* Fixed center info */}
                          <td className="px-3 sticky left-[200px] pr-10 z-10 bg-white py-4 text-xs text-center text-black text-nowrap">
                            <div className="w-[50px]">{patient.centerId?.centerName}</div>
                          </td>

                          {/* Therapist Name */}
                          <td className="px-3 sticky z-10 pr-10 left-[340px] text-nowrap bg-white py-4 text-xs text-left">
                            {notes[0].doctorId?.firstName} {notes[0].doctorId?.lastName}
                          </td>

                          {/* Iterate over your dates array */}
                          {dateArray?.map((date, _pindex) => {
                            const notesForDate = notesByDate[date] || [];
                            const dayOfWeek = new Date(date).getDay();
                            if (
                              data &&
                              data?.loa?.filter(
                                (loa) =>
                                  loa?.patientId === patient._id &&
                                  formatDate(loa.noteDateTime) === formatDate(date)
                              ).length > 0
                            ) {
                              return (
                                <td
                                  key={date}
                                  className={`px-3 py-4 text-xs ${
                                    _pindex % 2 === 0 ? "" : "bg-gray-100"
                                  } text-center font-medium text-red-500`}
                                >
                                  <div
                                    className="mx-auto w-fit "
                                    title="The Patient is on LOA Today."
                                  >
                                    <svg
                                      id="Component_44_1"
                                      data-name="Component 44 – 1"
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16.909"
                                      height="16.859"
                                      viewBox="0 0 16.909 16.859"
                                    >
                                      <path
                                        id="Union_24"
                                        data-name="Union 24"
                                        d="M-3219.633-2233.984a1.243,1.243,0,0,1-.674-.992c-.032-.553-.028-1.1-.018-1.587a5.3,5.3,0,0,1-3.038-1.666,5.3,5.3,0,0,1-1.365-3.43c-.031-1.336-.031-2.649,0-3.9a5.322,5.322,0,0,1,5.234-5.192c.363-.007.748-.01,1.214-.01q.5,0,1,0l.66,0,.334,0h2.967a5.487,5.487,0,0,1,3.906,1.562,5.486,5.486,0,0,1,1.563,3.906v.229c0,1.052.007,2.14,0,3.213a5.391,5.391,0,0,1-1.285,3.527,5.329,5.329,0,0,1-3.3,1.786,7.767,7.767,0,0,1-1.051.067c-.2,0-.393.007-.58.021a6.045,6.045,0,0,0-3.878,1.753c-.04.039-.083.084-.128.133a2.531,2.531,0,0,1-.448.407,1.46,1.46,0,0,1-.753.251A.858.858,0,0,1-3219.633-2233.984Zm.166-15.45a4,4,0,0,0-3.938,3.9c-.031,1.235-.031,2.527,0,3.841a3.945,3.945,0,0,0,3.479,3.851.967.967,0,0,1,.929,1.091c-.01.385-.019.816-.008,1.252.045-.048.092-.1.143-.148a7.333,7.333,0,0,1,4.707-2.124c.222-.016.439-.02.65-.024a6.71,6.71,0,0,0,.876-.051,3.97,3.97,0,0,0,3.459-4.017c.008-1.065,0-2.15,0-3.2v-.229a4.03,4.03,0,0,0-4.15-4.15c-.675,0-1.35,0-2.025,0l-.936,0h0c-.335,0-.669,0-1,0h0l-.991,0C-3218.736-2249.445-3219.113-2249.442-3219.467-2249.434Z"
                                        transform="translate(3224.75 2250.767)"
                                        fill="#D1D5DB"
                                      />
                                      <path
                                        id="Path_1086"
                                        data-name="Path 1086"
                                        d="M10.635,5.873H4.456a.75.75,0,0,1,0-1.5h6.179a.75.75,0,0,1,0,1.5Z"
                                        transform="translate(1.475 0.794)"
                                        fill="#D1D5DB"
                                      />
                                      <path
                                        id="Path_1087"
                                        data-name="Path 1087"
                                        d="M8.679,5.873H4.456a.75.75,0,0,1,0-1.5H8.679a.75.75,0,0,1,0,1.5Z"
                                        transform="translate(0.342 3.968)"
                                        fill="#D1D5DB"
                                      />
                                    </svg>
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td
                                key={date}
                                className={`px-3 py-4 text-xs ${
                                  _pindex % 2 === 0 ? "" : "bg-gray-100"
                                }  text-center font-medium text-black`}
                              >
                                {notesForDate.length > 0 ? (
                                  <div className="flex flex-col gap-1 justify-center">
                                    {notesForDate.map((value) => (
                                      <div
                                        key={value._id}
                                        title={
                                          value.sessionType?.length
                                            ? value.sessionType.join(", ")
                                            : ""
                                        }
                                        className="flex items-center justify-center gap-2"
                                      >
                                        <div className="relative">
                                          <img
                                            onClick={() => {
                                              setModalNote([value]);
                                              setState((prev) => ({
                                                ...prev,
                                                displayModal: true,
                                                patientData: patient,
                                                doctorData: value.doctorId
                                              }));
                                            }}
                                            src={messageIcon}
                                            className="w-4 h-4 text-[#505050] cursor-pointer"
                                          />
                                          {value.note?.length > 0 && (
                                            <div className="-top-1 -right-1 p-1 rounded-full bg-red-500 absolute"></div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-base">
                                            {value.sessionType?.length
                                              ? value.sessionType
                                                  .toString()
                                                  .match(/\b[A-Z]{1,4}\b(?=\s*-\s*)/g)
                                                  ?.join(", ")
                                              : null}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : dayOfWeek === 0 ? (
                                  <div className="text-xs text-gray-500">Sunday</div>
                                ) : (
                                  "--"
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Modal
        // crossIcon
        isOpen={state.displayModal}
        toggleModal={() => {
          setModalNote([]);
          setState((prev) => ({
            ...prev,
            displayModal: false,
            patientData: {
              _id: "",
              firstName: "",
              lastName: "",
              uhid: "",
              patientPicUrl: "",
              gender: ""
            },
            doctorData: {
              _id: "",
              firstName: "",
              lastName: "",
              centerId: { centerName: "" }
            }
          }));
        }}
      >
        <div className="w-3xl  h-[70vh] overflow-hidden  mx-auto bg-gray-100 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div
              className={`flex border-2 ${
                state.patientData?.gender == "Male"
                  ? "border-[#00685F]"
                  : state.patientData?.gender == "Female"
                  ? "border-[#F14E9A]"
                  : "border-gray-500"
              } rounded-full mr-4 w-10 h-10 bg-[#C1D1A8] border overflow-hidden items-center justify-center`}
            >
              {state.patientData.patientPicUrl ? (
                <img
                  alt="Profile picture of a man with short hair and beard, wearing a blue shirt"
                  className=" rounded-full object-cover"
                  src={state.patientData.patientPicUrl}
                />
              ) : (
                <div className="uppercase  text-sm font-medium">
                  {state.patientData?.firstName?.trim().slice(0, 1)}
                  {state.patientData?.lastName?.trim().slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                {state.patientData.firstName} {state.patientData.lastName}
              </span>
              <span className="text-xs text-gray-700 leading-tight">
                {formatId(state.patientData.uhid)}
              </span>
            </div>
            <div className="flex-1"></div>
            <div className="text-left">
              <p className="text-xs text-[#393939] font-medium leading-tight">Center</p>
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {state.patientData.centerId?.centerName}
              </p>
            </div>
            <div className="text-left px-4">
              <p className="text-xs text-[#393939] font-medium  leading-tight">Doctor</p>
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {state.doctorData.firstName} {state.doctorData.lastName}
              </p>
            </div>
          </div>
          <div className="my-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900 mb-2">Doctor notes</p>
            </div>
            {modalNote?.map((value: INote, index) => (
              <div className="mb-4" key={index}>
                <p className="text-xs text-right font-bold text-gray-900 leading-tight">
                  {value.noteDateTime && formatDate(value?.noteDateTime)}
                  {value?.sessionType?.length ? ` (${value?.sessionType.join(", ")})` : ""}
                </p>
                <div className="w-full mt-4 h-[50vh] overflow-auto">
                  <p
                    dangerouslySetInnerHTML={{ __html: value.note }}
                    key={index}
                    className="text-xs my-2 font-semibold text-black bg-[#EEEEEE] rounded-md p-3 leading-relaxed"
                  ></p>
                </div>
              </div>
            ))}
          </div>
          <div
            className="absolute bg-primary-dark p-1 rounded-[6px] top-3 right-3 cursor-pointer"
            onClick={() => {
              setModalNote([]);
              setState((prev) => ({
                ...prev,
                displayModal: false,
                patientData: {
                  _id: "",
                  firstName: "",
                  lastName: "",
                  uhid: "",
                  patientPicUrl: ""
                },
                doctorData: {
                  _id: "",
                  firstName: "",
                  lastName: "",
                  centerId: { centerName: "" }
                }
              }));
            }}
          >
            <svg
              className="w-3 h-3  text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TherapistWiseSession;
